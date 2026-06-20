---
title: Momentum and Adaptive Optimizers: From Nesterov to AdamW
date: 2026-06-20
category: Optimization
tags: [momentum, Adam, adaptive optimization]
description: A detailed comparison of momentum, Nesterov acceleration, AdaGrad, RMSProp, Adam, AdamW, and memory-efficient optimizer variants.
---

## Why Plain Gradient Descent Is Not the End

First-order algorithms access an objective through an oracle that returns function values and gradients. A method whose iterates remain in the span of observed gradients faces a fundamental lower bound: for general smooth convex objectives, no such method can converge faster than order $1/k^2$ in objective error.

Gradient descent achieves only $O(1/k)$. This gap shows that acceleration is possible, but it requires using gradient history more carefully than a simple current-gradient step.

## Polyak Momentum

Momentum maintains a velocity:

$$
v_{k+1}=\beta v_k+\nabla f(x_k),
\qquad
x_{k+1}=x_k-\eta v_{k+1}.
$$

The velocity is an exponentially weighted sum of past gradients. In a narrow quadratic valley, gradient signs alternate across the steep direction, so those components cancel. Components along the consistent descent direction accumulate.

Momentum can therefore reduce zigzagging and move faster through directions of low curvature. On a strongly convex quadratic with carefully chosen parameters, the dependence on condition number improves from roughly $\kappa$ to $\sqrt\kappa$.

The limitation is sensitivity. Parameters optimal for one curvature spectrum may oscillate or diverge on another, and classical heavy-ball guarantees do not transfer automatically to arbitrary nonconvex neural networks.

## Nesterov Acceleration

Nesterov momentum computes the gradient at a look-ahead position. One common form is

$$
y_k=x_k+\beta_k(x_k-x_{k-1}),
\qquad
x_{k+1}=y_k-\eta\nabla f(y_k).
$$

The method first extrapolates using momentum, then corrects based on the gradient at the extrapolated point. For smooth convex objectives it achieves

$$
f(x_k)-f^*=O(1/k^2),
$$

which matches the first-order lower bound up to constants. In the strongly convex setting, the rate improves to approximately

$$
O\left(\left(1-\frac{1}{\sqrt\kappa}\right)^k\right).
$$

Nesterov's guarantee is not simply the result of a larger effective step. The coupled extrapolation and correction maintain a carefully designed potential function combining objective error and distance.

## The Global Learning-Rate Problem

Momentum uses history but still applies one global step scale. If coordinates have very different gradient magnitudes or curvature, one learning rate is too small for some directions and unstable for others.

Adaptive methods construct a diagonal preconditioner from gradient statistics. A generic update is

$$
x_{k+1}=x_k-\eta D_k^{-1}m_k,
$$

where $m_k$ estimates direction and $D_k$ rescales coordinates.

## AdaGrad

AdaGrad accumulates squared gradients:

$$
G_k=G_{k-1}+g_k\odot g_k,
\qquad
x_{k+1}=x_k-eta\frac{g_k}{\sqrt{G_k}+\epsilon}.
$$

Coordinates that have received large gradients get smaller future steps. Rarely updated coordinates retain a relatively large learning rate, making AdaGrad effective for sparse features.

Its weakness is irreversible accumulation. Since $G_k$ only increases, effective step sizes may decay to nearly zero even when continued learning is needed.

## RMSProp

RMSProp replaces the cumulative sum with an exponential moving average:

$$
v_k=\beta_2v_{k-1}+(1-\beta_2)g_k^2,
\qquad
x_{k+1}=x_k-\eta\frac{g_k}{\sqrt{v_k}+\epsilon}.
$$

Old gradients are forgotten, so the denominator adapts to recent scale rather than growing forever. This is well suited to nonstationary neural-network training, though the original method was introduced primarily as a practical algorithm rather than through a complete convex convergence theory.

## Adam

Adam combines momentum in the numerator with RMSProp-style scaling in the denominator:

$$
m_k=\beta_1m_{k-1}+(1-\beta_1)g_k,
$$

$$
v_k=\beta_2v_{k-1}+(1-\beta_2)g_k^2.
$$

Because both moving averages start at zero, early estimates are biased downward. Bias correction gives

$$
\hat m_k=\frac{m_k}{1-\beta_1^k},
\qquad
\hat v_k=\frac{v_k}{1-\beta_2^k},
$$

followed by

$$
x_{k+1}=x_k-\eta\frac{\hat m_k}{\sqrt{\hat v_k}+\epsilon}.
$$

If the second moment tracks $g_k^2$ very quickly, the normalized direction resembles $\operatorname{sign}(g_k)$. This explains Adam's robustness to coordinate scale, but also shows that it can discard gradient-magnitude information.

## Adam Is Not Automatically Convergent

The exponential second-moment estimate can decrease, causing an effective coordinate learning rate to increase unexpectedly. Carefully constructed convex examples make standard Adam fail to converge.

Variants such as AMSGrad enforce a nondecreasing maximum second-moment estimate. In deep learning, standard Adam often works well, but empirical success should not be confused with a universal theoretical guarantee.

## Why AdamW Separates Weight Decay

For SGD, adding $\lambda\|x\|^2/2$ to the objective produces a gradient term $\lambda x$, which is equivalent to multiplicative weight decay.

For Adam, including $\lambda x$ inside the gradient causes it to be divided by the adaptive denominator. Different coordinates then receive different effective regularization. AdamW instead decouples decay:

$$
x_{k+1}=(1-\eta\lambda)x_k
-\eta\frac{\hat m_k}{\sqrt{\hat v_k}+\epsilon}.
$$

The shrinkage is now independent of gradient normalization, making the regularization parameter easier to interpret and tune.

## Warmup and Gradient Clipping

Adaptive methods still benefit from learning-rate warmup. Early gradient statistics are unreliable, and large updates can destabilize attention logits or normalization layers. Warmup gradually increases the global step while moment estimates become representative.

Global-norm clipping rescales a gradient when

$$
\|g\|>c,
\qquad
g\leftarrow c\frac{g}{\|g\|}.
$$

It limits rare destructive updates while preserving direction. Clipping is a stability device, not a cure for a consistently excessive learning rate.

## The Optimizer Memory Bottleneck

Adam stores first and second moments for every parameter, commonly in FP32. For very large models this state becomes a major memory cost.

- **8-bit Adam** quantizes optimizer states while retaining higher precision for sensitive statistics or blocks.
- **Adafactor** factorizes the second-moment estimate of a matrix into row and column statistics, reducing memory from matrix size to the sum of dimensions.
- **GaLore** projects gradients into a low-rank subspace and maintains optimizer state there, periodically updating the projection.

Each method assumes structure in optimizer state. The memory reduction is valuable only if the approximation preserves the directions needed for training.

## Method Comparison

| Method | History | Coordinate scaling | Main strength | Main weakness |
|---|---|---|---|---|
| Momentum | First moment | No | Reduces oscillation | Curvature-sensitive tuning |
| Nesterov | Extrapolated first moment | No | Optimal convex first-order rate | More delicate analysis/tuning |
| AdaGrad | Cumulative second moment | Yes | Sparse features | Learning rate vanishes |
| RMSProp | EMA second moment | Yes | Nonstationary scale | Limited original theory |
| Adam | First and second EMA | Yes | Strong practical default | Memory and convergence caveats |
| AdamW | Adam plus decoupled decay | Yes | Cleaner regularization | Same moment-state cost |

## Final Perspective

Momentum improves how gradients are combined across time. Adaptive methods improve how directions are scaled across coordinates. Adam combines both, but it does not remove the need for a global schedule, warmup, clipping, or regularization design. Optimizer choice is ultimately a trade-off among convergence geometry, stochastic stability, memory, and generalization.
