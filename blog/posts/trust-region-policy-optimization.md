---
title: Trust Region Policy Optimization: A Step-by-Step Derivation
date: 2026-06-21
category: Reinforcement Learning
order: 1
tags: [TRPO, policy gradient, reinforcement learning]
description: A detailed derivation of TRPO, from policy-gradient distribution shift to KL trust regions, natural gradients, conjugate gradient, and PPO.
---

## The Main Idea

Policy gradient gives a direction that improves the current policy **locally**. The difficulty is deciding how far to move. A large parameter update changes the policy, which changes the states visited by that policy, which can invalidate the advantage estimates used to construct the update.

Trust Region Policy Optimization (TRPO) addresses this problem by maximizing a local surrogate objective while constraining the new policy to remain close to the old policy in KL divergence:

$$
\max_\theta L_{\theta_{old}}(\theta)
\quad\text{subject to}\quad
\bar D_{KL}(\theta_{old},\theta)\le\delta.
$$

The trust region says: improve the policy, but only inside the region where the local approximation is still believable.

## Reinforcement Learning as Trajectory Optimization

An MDP consists of states $\mathcal S$, actions $\mathcal A$, transition dynamics $P$, reward function $r$, initial-state distribution $\rho_0$, and discount factor $\gamma$.

A stochastic policy $\pi_\theta(a\mid s)$ induces trajectories

$$
\tau=(s_0,a_0,s_1,a_1,\ldots).
$$

Ignoring environment terms that do not depend on $\theta$, the trajectory probability contains

$$
p_\theta(\tau)\propto\prod_t\pi_\theta(a_t\mid s_t).
$$

The discounted return is

$$
R(\tau)=\sum_{t=0}^{\infty}\gamma^t r(s_t,a_t),
$$

and the objective is expected return:

$$
\eta(\theta)=\mathbb E_{\tau\sim p_\theta}[R(\tau)].
$$

The environment transition is normally unknown and cannot be differentiated directly. The likelihood-ratio identity avoids that requirement:

$$
\nabla_\theta p_\theta(\tau)
=p_\theta(\tau)\nabla_\theta\log p_\theta(\tau).
$$

Because

$$
\nabla_\theta\log p_\theta(\tau)
=\sum_t\nabla_\theta\log\pi_\theta(a_t\mid s_t),
$$

the policy gradient can be estimated from sampled trajectories.

## Why the Advantage Function Appears

A Monte Carlo estimator that weights every score term by the full trajectory return is unbiased but has high variance. A state-dependent baseline can be subtracted without changing the expectation because

$$
\mathbb E_{a\sim\pi_\theta(\cdot\mid s)}
[\nabla_\theta\log\pi_\theta(a\mid s)b(s)]=0.
$$

Choosing $b(s)=V^\pi(s)$ gives the advantage

$$
A^\pi(s,a)=Q^\pi(s,a)-V^\pi(s).
$$

The policy-gradient theorem can then be written as

$$
\nabla_\theta\eta(\theta)
=\mathbb E_{\tau\sim\pi_\theta}
\left[\sum_t A^{\pi_\theta}(s_t,a_t)
\nabla_\theta\log\pi_\theta(a_t\mid s_t)\right].
$$

The advantage measures whether an action was better or worse than the policy's usual behavior at that state.

## The Step-Size Problem

Suppose trajectories are collected from $\pi_{old}$ and produce an estimated gradient $\hat g$. A naive update is

$$
\theta_{new}=\theta_{old}+\alpha\hat g.
$$

If $\alpha$ is too small, learning is inefficient. If it is too large, the new policy can visit a very different state distribution. The sampled advantages $\hat A^{\pi_{old}}$ describe actions under the old visitation pattern, not arbitrary behavior under a distant new policy.

This creates a feedback loop unique to RL: updating the model changes the distribution that generates future training data. Supervised learning usually evaluates new parameters on the same fixed input distribution; on-policy RL does not.

## Performance Difference Identity

For any old and new policies,

$$
\eta(\pi_{new})
=\eta(\pi_{old})+
\mathbb E_{\tau\sim\pi_{new}}
\left[\sum_{t=0}^{\infty}\gamma^t
A^{\pi_{old}}(s_t,a_t)\right].
$$

The identity follows by expanding

$$
A^{\pi_{old}}(s_t,a_t)
=r_t+\gamma V^{\pi_{old}}(s_{t+1})
-V^{\pi_{old}}(s_t)
$$

and telescoping the value terms.

Define the unnormalized discounted state-visitation frequency

$$
\rho^\pi(s)=\sum_{t=0}^{\infty}
\gamma^t\Pr(s_t=s\mid\pi).
$$

The performance difference can be expressed as

$$
\eta(\pi_{new})=\eta(\pi_{old})+
\sum_s\rho^{\pi_{new}}(s)
\sum_a\pi_{new}(a\mid s)A^{\pi_{old}}(s,a).
$$

This equation is exact, but it depends on the new policy's state distribution. Evaluating it would require executing every candidate policy.

## The Local Surrogate Objective

TRPO replaces the unknown new visitation distribution with the old one:

$$
L_{\pi_{old}}(\pi_{new})
=\eta(\pi_{old})+
\sum_s\rho^{\pi_{old}}(s)
\sum_a\pi_{new}(a\mid s)A^{\pi_{old}}(s,a).
$$

This surrogate has two crucial properties at the old policy:

$$
L_{\pi_{old}}(\pi_{old})=\eta(\pi_{old}),
$$

$$
\nabla_\theta L_{\theta_{old}}(\theta)
\big|_{\theta=\theta_{old}}
=\nabla_\theta\eta(\theta)
\big|_{\theta=\theta_{old}}.
$$

The values and gradients match locally. Far from $\pi_{old}$, however, $\rho^{\pi_{new}}$ and $\rho^{\pi_{old}}$ may differ substantially.

Using importance sampling, the sample-based part of the surrogate can be estimated from old-policy data:

$$
\hat L(\theta)
=\mathbb E_{(s_t,a_t)\sim\pi_{old}}
\left[
\frac{\pi_\theta(a_t\mid s_t)}
{\pi_{old}(a_t\mid s_t)}
\hat A_t
\right].
$$

## Why the Trust Region Uses KL Divergence

An ordinary Euclidean constraint such as

$$
\|\theta-\theta_{old}\|_2\le\epsilon
$$

does not reliably measure policy change. Neural networks can have parameter directions where a small weight movement causes a large probability shift, and other directions where a large movement changes almost nothing.

TRPO constrains the policy distribution instead:

$$
\bar D_{KL}(\theta_{old},\theta)
=\mathbb E_{s\sim\rho^{\pi_{old}}}
\left[D_{KL}
(\pi_{old}(\cdot\mid s)\|\pi_\theta(\cdot\mid s))
\right].
$$

The practical optimization problem is

$$
\max_\theta\hat L_{\theta_{old}}(\theta)
\quad\text{subject to}\quad
\bar D_{KL}(\theta_{old},\theta)\le\delta.
$$

The radius $\delta$ controls how much the action distribution may change on states observed under the old policy.

{{interactive:trust-region}}

## From the Constraint to a Natural Gradient

Let $\Delta\theta=\theta-\theta_{old}$. Linearize the surrogate:

$$
L(\theta_{old}+\Delta\theta)
\approx L(\theta_{old})+g^T\Delta\theta,
$$

where

$$
g=\nabla_\theta L(\theta)\big|_{\theta_{old}}.
$$

The KL divergence is zero at $\theta_{old}$, and its first derivative is also zero there. Its second-order expansion is

$$
\bar D_{KL}(\theta_{old},\theta_{old}+\Delta\theta)
\approx\frac12\Delta\theta^TF\Delta\theta,
$$

where $F$ is the Fisher information matrix:

$$
F=\mathbb E
\left[
\nabla_\theta\log\pi_\theta(a\mid s)
\nabla_\theta\log\pi_\theta(a\mid s)^T
\right].
$$

The local subproblem becomes

$$
\max_{\Delta\theta}g^T\Delta\theta
\quad\text{subject to}\quad
\frac12\Delta\theta^TF\Delta\theta\le\delta.
$$

The KKT conditions yield

$$
\Delta\theta^*
=\sqrt{\frac{2\delta}{g^TF^{-1}g}}F^{-1}g.
$$

The direction $F^{-1}g$ is the natural gradient. It is the steepest ascent direction when distance is measured in local KL geometry rather than Euclidean parameter distance.

## Why the Fisher Matrix Is Not Formed

For a neural policy with millions of parameters, $F$ is a matrix with trillions of entries. Explicit construction and inversion are impossible.

TRPO instead solves

$$
Fd=g
$$

approximately with conjugate gradient (CG). CG requires only products $Fv$, never the matrix itself. Fisher-vector products can be computed through automatic differentiation from the KL divergence or score-function structure.

The core CG recurrence is

$$
d_0=0,\qquad r_0=g,\qquad p_0=r_0,
$$

$$
q_k=Fp_k,
\qquad
\alpha_k=\frac{r_k^Tr_k}{p_k^Tq_k},
$$

$$
d_{k+1}=d_k+\alpha_kp_k,
\qquad
r_{k+1}=r_k-\alpha_kq_k,
$$

$$
\beta_k=\frac{r_{k+1}^Tr_{k+1}}{r_k^Tr_k},
\qquad
p_{k+1}=r_{k+1}+\beta_kp_k.
$$

After a small number of iterations, $d\approx F^{-1}g$. Damping is commonly added to improve conditioning.

## Scaling and Backtracking Line Search

CG determines a direction but not a safe step length. First scale $d$ to the quadratic trust-region boundary:

$$
\Delta\theta_{full}
=\sqrt{\frac{2\delta}{d^TFd}}d.
$$

This scaling satisfies

$$
\frac12\Delta\theta_{full}^TF
\Delta\theta_{full}=\delta
$$

under the local KL approximation.

The approximation may still be inaccurate because the surrogate is linearized, KL is quadraticized, advantages are sampled, and CG is inexact. TRPO therefore performs backtracking line search:

$$
\theta_{candidate}
=\theta_{old}+\alpha\Delta\theta_{full},
\qquad
\alpha\in\{1,1/2,1/4,\ldots\}.
$$

The first candidate is accepted only if the measured average KL is below $\delta$ and the sampled surrogate improves. Otherwise the step is shortened. If no candidate passes, the update is rejected.

## The Complete Practical Algorithm

One TRPO iteration can be summarized as follows:

1. Roll out trajectories with $\pi_{old}$.
2. Estimate returns and advantages, typically with a learned value function.
3. Compute the surrogate policy gradient $g$.
4. Define a Fisher-vector product from the mean KL divergence.
5. Use conjugate gradient to obtain $d\approx F^{-1}g$.
6. Scale $d$ to the quadratic KL boundary.
7. Backtrack along the scaled direction.
8. Accept the first candidate satisfying the empirical KL and surrogate-improvement tests.
9. Fit or update the value-function baseline.

The chain of approximations is important:

$$
\text{performance identity}
\rightarrow\text{surrogate}
\rightarrow\text{KL constraint}
\rightarrow\text{quadratic subproblem}
\rightarrow\text{natural gradient}
\rightarrow\text{CG and line search}.
$$

## What the Monotonic-Improvement Result Actually Says

The theoretical argument bounds true performance using the surrogate and a maximum divergence between policies. A representative form is

$$
\eta(\pi_{new})
\ge L_{\pi_{old}}(\pi_{new})
-C D_{KL}^{max}(\pi_{old},\pi_{new}),
$$

where $C$ depends on $\gamma$ and the maximum advantage magnitude. Optimizing the resulting penalized or constrained objective can produce monotonically non-decreasing performance under exact quantities and a max-KL condition.

Practical TRPO is an approximation to this theorem:

- It constrains average KL rather than maximum KL.
- It uses finitely sampled trajectories and estimated advantages.
- It approximately solves the natural-gradient system.
- It verifies the surrogate, not the exact return.

The theorem motivates the algorithm, but practical implementations should not claim an unconditional monotonic guarantee for every sampled update.

## Experimental Message

The original TRPO experiments evaluated continuous-control tasks such as Swimmer, Hopper, and Walker. TRPO was especially competitive on harder locomotion problems, where aggressive unconstrained policy updates can collapse performance.

The lasting contribution was broader than a single benchmark result. TRPO demonstrated that controlling policy-distribution movement could make policy-gradient optimization reliably stable and scalable to neural policies.

## From TRPO to PPO

TRPO is principled but operationally heavy. It needs Fisher-vector products, conjugate gradient, KL-based scaling, and backtracking line search.

Proximal Policy Optimization (PPO) keeps the same motivation but replaces the hard trust-region solve with a clipped importance-ratio objective:

$$
\mathbb E_t\left[
\min\left(
r_t(\theta)\hat A_t,
\operatorname{clip}(r_t(\theta),1-\epsilon,1+\epsilon)\hat A_t
\right)
\right],
$$

where

$$
r_t(\theta)=
\frac{\pi_\theta(a_t\mid s_t)}
{\pi_{old}(a_t\mid s_t)}.
$$

Clipping discourages changes that would make the sampled probability ratio move too far in a reward-improving direction. PPO can be optimized with ordinary first-order methods such as Adam and minibatches.

PPO is not mathematically identical to enforcing a KL ball, and clipping does not reproduce TRPO's theorem. It is a simpler approximation to the same central idea: prevent a local policy-gradient estimate from authorizing an excessively large policy change.

## Practical Failure Modes

Several implementation details strongly affect TRPO:

- **Poor advantage estimates:** noisy or biased advantages corrupt both the gradient and line-search objective.
- **Incorrect KL direction:** the implementation should consistently use the intended old-to-new KL.
- **Insufficient CG damping:** an ill-conditioned Fisher system produces unstable directions.
- **Weak line-search checks:** testing only predicted improvement can violate the actual KL bound.
- **Unnormalized advantages:** scale variation changes numerical behavior even if the idealized direction is invariant.
- **Value-function overfitting:** a poor baseline increases variance in subsequent iterations.

Monitoring measured KL, accepted step fraction, surrogate change, explained variance, and episodic return makes failures easier to diagnose.

## Final Takeaways

1. Policy-gradient data are local because changing the policy changes the state distribution.
2. The surrogate objective matches true performance in value and gradient at the old policy.
3. KL divergence defines a trust region in policy space, where closeness actually matters.
4. A linear surrogate and quadratic KL approximation produce the natural-gradient direction $F^{-1}g$.
5. Conjugate gradient computes that direction without explicitly forming $F$.
6. Scaling and backtracking verify that the approximate update is safe in practice.
7. PPO inherits TRPO's proximal-update motivation while replacing the second-order constrained solve with first-order clipping.

TRPO's most important lesson is not a particular optimizer implementation. It is the idea that an update should be limited by how much it changes the model's behavior, not merely by how far its parameters move.

## Reference

John Schulman, Sergey Levine, Philipp Moritz, Michael I. Jordan, and Pieter Abbeel. [Trust Region Policy Optimization](https://proceedings.mlr.press/v37/schulman15.html), ICML 2015.
