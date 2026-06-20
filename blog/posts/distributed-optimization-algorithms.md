---
title: Distributed Optimization: Local SGD, Consensus, and Communication
date: 2026-06-20
category: Optimization
order: 8
tags: [distributed optimization, federated learning, consensus]
description: A detailed guide to parallel SGD, local SGD, FedAvg, decentralized optimization, topology, compression, asynchrony, and robust aggregation.
---

## The Canonical Distributed Objective

Distributed optimization often considers

$$
\min_x F(x)=\frac{1}{n}\sum_{i=1}^{n}f_i(x),
$$

where worker $i$ owns data or an objective term $f_i$. The goal is not merely to distribute computation. The algorithm must decide how frequently workers communicate, how they combine information, and how disagreement affects convergence.

There are two common regimes:

- In datacenter training, worker data are often shuffled and communication is fast but still expensive.
- In federated learning, devices are intermittent, bandwidth-limited, and hold strongly non-IID local data.

The same update can behave very differently across these regimes.

## Synchronous Parallel SGD

At iteration $k$, every worker computes a stochastic gradient $g_i^k$ at the same parameter $x_k$. A server or collective averages them:

$$
g^k=\frac{1}{n}\sum_{i=1}^{n}g_i^k,
\qquad
x_{k+1}=x_k-\eta g^k.
$$

If worker gradients are independent and unbiased with variance $\sigma^2$, averaging reduces variance to approximately $\sigma^2/n$. Computation per step is parallel, and the larger effective batch can improve hardware utilization.

The costs are gradient communication every iteration and synchronization at the slowest worker. Beyond a certain worker count, the local batch becomes too small or communication dominates, so speedup stops being linear.

## The Arithmetic-Intensity View

Distributed scaling depends on computation per communicated byte. Large matrix operations provide enough work to hide or amortize communication; tiny models or small local batches do not.

Let $T_{comp}$ be local compute time and $T_{comm}$ be synchronization time. Ideal scaling requires $T_{comm}\ll T_{comp}$ or effective overlap between them. Adding workers reduces compute per worker but often leaves collective latency and model-gradient size unchanged, eventually making communication dominant.

## Local SGD

Local SGD reduces communication by allowing each worker to take $\tau$ local steps before averaging:

$$
x_{i,k,s+1}=x_{i,k,s}-\eta g_i(x_{i,k,s}),
\qquad s=0,\ldots,\tau-1,
$$

followed by

$$
x_{k+1}=\frac{1}{n}\sum_i x_{i,k,\tau}.
$$

When $\tau=1$, this is synchronous parallel SGD. Larger $\tau$ reduces synchronization frequency by a factor of roughly $\tau$.

The new error source is **client drift**. Workers evaluate gradients at different local parameters, and if their objectives differ, they move toward different local optima. Increasing local work therefore saves communication but increases disagreement.

Local SGD works best when data are close to IID, learning rates are controlled, and communication is the primary bottleneck. With severe heterogeneity, more local steps can hurt both convergence and final quality.

## Federated Averaging

FedAvg is a local-SGD-style method designed for partial device participation. A server selects clients, broadcasts the current model, clients train locally for several epochs, and the server computes a data-size-weighted average:

$$
x_{k+1}=\sum_{i\in S_k}
\frac{n_i}{\sum_{j\in S_k}n_j}x_i^{k+1}.
$$

Weighting reflects different local dataset sizes. In addition to drift, federated optimization must handle client sampling, dropouts, privacy, variable compute, and communication asymmetry.

Methods such as proximal local objectives or control variates can reduce heterogeneity-induced drift, but they introduce state and tuning complexity.

## Decentralized Optimization

A parameter server is a coordination and bandwidth bottleneck. Decentralized methods let each node communicate only with graph neighbors.

Let $W$ be a mixing matrix satisfying, ideally,

$$
W\mathbf1=\mathbf1,
\qquad
\mathbf1^TW=\mathbf1^T,
$$

with $W_{ij}=0$ when nodes $i$ and $j$ are not connected. A decentralized SGD update is

$$
x_i^{k+1}=\sum_jW_{ij}x_j^k-\eta g_i(x_i^k).
$$

The mixing term drives consensus, while the gradient term drives optimization. These goals compete: local gradients create disagreement that communication must remove.

## Topology and Spectral Gap

Consensus speed depends on the second-largest eigenvalue magnitude of $W$. A larger spectral gap

$$
1-|\lambda_2(W)|
$$

means faster mixing.

- A complete graph mixes quickly but requires dense communication.
- A ring has low degree but slow information propagation.
- Expander-like graphs offer relatively fast mixing with sparse connectivity.

Topology is therefore an algorithmic parameter. The number of edges determines per-round cost, while spectral properties determine how many rounds are needed.

## Gradient Tracking

Basic decentralized SGD can converge to a neighborhood or suffer bias under heterogeneous objectives. Gradient-tracking methods maintain an auxiliary variable estimating the global gradient:

$$
y_i^{k+1}=\sum_jW_{ij}y_j^k
+\nabla f_i(x_i^{k+1})-\nabla f_i(x_i^k).
$$

The difference term updates local gradient information, and mixing approximates its network average. This can recover exact convergence under stronger assumptions.

## Communication Compression

Workers can quantize, sparsify, or sketch updates before transmission. A compressor $Q$ may satisfy unbiasedness,

$$
\mathbb E[Q(g)]=g,
$$

or a bounded-error property. Compression reduces bytes but introduces noise or bias.

Error feedback stores the compression residual:

$$
u_k=g_k+e_k,
\qquad q_k=Q(u_k),
\qquad e_{k+1}=u_k-q_k.
$$

Information discarded in one round is reintroduced later, often greatly improving convergence for biased sparsifiers.

## Asynchronous SGD

Asynchronous systems let workers update without a global barrier. This avoids waiting for stragglers but applies gradients computed at stale parameters:

$$
x_{k+1}=x_k-\eta g(x_{k-\tau_k}).
$$

If delay $\tau_k$ is bounded and steps are sufficiently small, convergence can still hold. Large or unbounded staleness makes a gradient poorly aligned with the current objective geometry.

Asynchrony trades synchronization idle time for optimization noise. Its value depends on worker variability, model sensitivity, and the consistency guarantees of the parameter store.

## Byzantine-Robust Aggregation

Some workers may return arbitrary or malicious updates. A simple mean has no protection: one unbounded vector can dominate it.

Robust alternatives include coordinate-wise medians, trimmed means, geometric medians, and neighbor-based selection rules. Their guarantees require an upper bound on the fraction of adversaries and assumptions about honest-gradient concentration.

Robustness can conflict with heterogeneity because a legitimate but unusual client update may resemble an outlier.

## ADMM for Distributed Convex Problems

Consensus ADMM introduces local variables $x_i$ and a shared $z$ with constraints $x_i=z$. Local objectives are minimized independently with quadratic agreement penalties, followed by aggregation and dual updates.

ADMM is attractive when each $f_i$ has a structured proximal or closed-form solve. For large nonconvex stochastic training, local SGD is usually simpler, but for separable convex objectives ADMM gives a principled primal-dual decomposition.

## Final Comparison

| Method | Communication pattern | Main benefit | Main error source |
|---|---|---|---|
| Parallel SGD | Global every step | Low gradient variance | Synchronization cost |
| Local SGD/FedAvg | Global every $\tau$ steps | Fewer rounds | Client drift |
| Decentralized SGD | Neighbor exchange | No central server | Consensus error |
| Compressed SGD | Reduced messages | Lower bandwidth | Compression noise |
| Async SGD | No global barrier | Straggler tolerance | Stale gradients |

## Final Perspective

Distributed optimization is governed by three interacting quantities: stochastic gradient noise, disagreement among workers, and communication cost. More local computation reduces communication but increases drift; denser topology improves consensus but increases traffic; asynchrony removes waiting but introduces staleness. The best algorithm matches these trade-offs to the actual data distribution and network.
