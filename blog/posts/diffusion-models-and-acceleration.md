---
title: Diffusion Models: Denoising, Score Matching, and Fast Sampling
date: 2026-06-20
category: Machine Learning Acceleration
order: 5
tags: [diffusion, generative models, model acceleration]
description: A detailed guide to DDPMs, score-based diffusion, guidance, numerical solvers, quantization, distillation, and temporal feature reuse.
---

## The Basic Construction

A diffusion model learns to reverse a gradual corruption process. The forward Markov chain adds Gaussian noise according to a fixed schedule:

$$
q(x_t\mid x_{t-1})=
\mathcal N(\sqrt{1-\beta_t}x_{t-1},\beta_tI).
$$

Define $\alpha_t=1-\beta_t$ and $\bar\alpha_t=\prod_{s=1}^{t}\alpha_s$. The closed form

$$
q(x_t\mid x_0)=
\mathcal N(\sqrt{\bar\alpha_t}x_0,(1-\bar\alpha_t)I)
$$

lets training sample any timestep directly:

$$
x_t=\sqrt{\bar\alpha_t}x_0+sqrt{1-\bar\alpha_t}\epsilon,
\qquad\epsilon\sim\mathcal N(0,I).
$$

For a long enough schedule, $x_T$ is close to standard Gaussian noise. Generation starts from this simple distribution and repeatedly denoises.

## Learning the Reverse Process

The reverse transition is modeled as

$$
p_\theta(x_{t-1}\mid x_t)
=\mathcal N(\mu_\theta(x_t,t),\Sigma_t).
$$

Rather than predicting the reverse mean directly, DDPM commonly predicts the noise that produced $x_t$. A widely used simplified objective is

$$
\mathcal L_{simple}=
\mathbb E_{x_0,t,\epsilon}
\left[\|\epsilon-\epsilon_\theta(x_t,t)\|_2^2\right].
$$

The likelihood-derived objective assigns timestep-dependent weights. In practice, simpler weighting can produce better perceptual samples because very small-noise timesteps might otherwise dominate.

Noise also affects frequencies differently. Fine, high-frequency details are destroyed earlier than coarse low-frequency content. During reverse generation, global structure tends to emerge before texture and edges. This helps explain why timestep weighting and step allocation affect content and detail differently.

## The Score-Based Interpretation

The score of a density is

$$
\nabla_x\log p_t(x).
$$

Diffusion can be formulated as a stochastic differential equation (SDE). Reversing it requires the score at every noise level. The marginal score is not directly available, but denoising score matching provides a tractable target based on the known conditional corruption distribution.

The reverse-time SDE remains stochastic. A related **probability flow ODE** has the same marginal distributions but defines deterministic trajectories. This connection is important because it allows diffusion sampling to use numerical ODE solvers and separates the learned score field from the algorithm that integrates it.

## Latent Diffusion

Running a U-Net repeatedly in pixel space is expensive. Latent diffusion first trains an autoencoder:

$$
z=E(x),\qquad \hat{x}=D(z),
$$

and performs diffusion in the lower-dimensional $z$ space. The autoencoder removes perceptually unimportant detail, while the diffusion model handles semantic generation. This reduces spatial size and permits flexible conditioning, but reconstruction quality is bounded by the autoencoder.

## Conditional Generation and Guidance

A conditional denoiser receives context such as a class label or text embedding. Classifier guidance combines the unconditional score with the gradient of a noisy-image classifier, following Bayes' rule. It requires a separate classifier trained across noise levels.

Classifier-free guidance avoids that classifier by training the same model with condition dropout. At sampling time:

$$
\hat\epsilon_	heta(x_t,c)=
\epsilon_	heta(x_t,\varnothing)
+s\left(\epsilon_	heta(x_t,c)-
\epsilon_	heta(x_t,\varnothing)\right).
$$

A larger guidance scale $s$ strengthens condition alignment, but too much guidance reduces diversity and can push samples into oversaturated or unnatural regions.

## Why Sampling Is Slow

Training can sample one random timestep per example, but generation must integrate a trajectory from noise to data. A large U-Net or Transformer is evaluated at every step. Acceleration methods attack three quantities:

1. The number of model evaluations.
2. The cost of each evaluation.
3. Redundant work across nearby evaluations.

## DDIM and High-Order Solvers

DDIM constructs a non-Markovian process with the same training objective and supports deterministic sampling. It can skip many training timesteps, reducing the number of function evaluations.

DPM-Solver treats diffusion sampling as solving an ODE with known structure. Higher-order updates use multiple model evaluations or previous estimates to reduce integration error per step. Better solvers are especially useful at moderate step counts, but extremely few steps still demand either distillation or a model trained for that regime.

Timestep placement is also an optimization problem. Uniformly spaced steps are not necessarily optimal because the score field changes more rapidly in some noise regions than others.

## Distillation and Consistency

Progressive distillation trains a student to reproduce the result of multiple teacher steps in one step. Repeating the procedure halves the required step count. The student changes, rather than only the sampler.

Consistency models learn outputs that are consistent along the same probability-flow trajectory. Points at different noise levels should map to the same clean-data endpoint, enabling one-step or few-step generation. The trade-off is a more specialized and difficult training objective.

## Quantizing Diffusion Models

Diffusion quantization is harder than ordinary feed-forward quantization for two reasons:

- Activation distributions shift substantially with timestep.
- Quantization error is fed back through many subsequent denoising steps.

A calibration set must therefore cover the trajectory rather than only clean inputs. Timestep-aware quantization can use different scales, calibration statistics, or small predictors for different noise levels. Uniform treatment of every timestep may fit the middle of the trajectory while failing near clean or highly noisy endpoints.

The practical speedup also depends on low-bit kernels for the dominant U-Net or Transformer operators. Smaller stored weights alone do not guarantee a proportional latency improvement.

## Temporal Feature Reuse

Adjacent denoising steps process similar inputs, so intermediate features can be highly redundant. Feature-reuse methods cache selected block outputs at keyframes and reuse them at nearby timesteps.

This is not equivalent to skipping a complete model evaluation. Frequently updated blocks can still track the changing sample while expensive, slowly varying blocks reuse cached values. Score mixing can combine fresh and reused estimates to reduce drift.

The central trade-off is cache age. Aggressive reuse saves computation but introduces stale features. Automated schedules can search for which layers and timesteps should be recomputed under a quality or latency constraint.

## Comparing Acceleration Strategies

| Strategy | What changes | Main risk |
|---|---|---|
| DDIM | Sampling trajectory | Error at very low step counts |
| DPM-Solver | Numerical integration rule | Solver assumptions and schedule sensitivity |
| Timestep search | Evaluation locations | Search may be model-specific |
| Distillation | Model and training | Additional teacher/student training |
| Consistency training | Learning objective | Quality-efficiency trade-off |
| Quantization | Precision per evaluation | Timestep-dependent accumulated error |
| Feature reuse | Work shared across steps | Stale features and drift |

## Final Perspective

Diffusion models are best understood as a learned time-dependent vector field plus a numerical procedure for following it. Quality depends on the learned denoiser, while speed depends on how that field is integrated and implemented. Solver design, low-precision kernels, and temporal reuse are complementary because they reduce different parts of the total sampling cost.
