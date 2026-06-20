---
title: A Beginner's Guide to Neural Network Pruning
date: 2026-06-18
tags: [pruning, model compression, deep learning]
description: How to make neural networks smaller and faster without sacrificing much accuracy — the core ideas behind weight pruning.
---

## Why Pruning?

Modern neural networks are massively over-parameterized. A ResNet-50 has ~25 million parameters; GPT-3 has 175 billion. Most of these parameters turn out to be redundant — removing them causes little to no drop in accuracy, while cutting memory and compute significantly.

**Pruning** is the process of setting a subset of weights to zero (or removing them entirely). A well-pruned network:

- Runs faster on CPU/GPU (if sparsity is structured)
- Consumes less memory
- Can be more robust to overfitting

## Types of Pruning

### Unstructured Pruning

Remove individual weights regardless of their location. The resulting weight matrix is **sparse** — most entries are zero, but the shape stays the same.

$$
w_i = 0 \quad \text{if} \quad |w_i| < \tau
$$

This is the simplest approach: just threshold weights by magnitude. It achieves high compression rates but requires **sparse matrix libraries** to actually speed up inference.

### Structured Pruning

Remove entire **filters**, **channels**, or **layers**. The resulting network is smaller in shape — no special hardware or libraries needed, and the speedup is immediate.

For a convolutional layer with output channels $C_{out}$, structured pruning selects a subset $S \subset \{1, \ldots, C_{out}\}$ of channels to keep:

$$
\hat{C}_{out} = |S| < C_{out}
$$

The trade-off: structured pruning is harder to do without accuracy loss because it removes coarser-grained structures.

## The Lottery Ticket Hypothesis

A striking result from Frankle & Carlin (2019): within a large randomly initialized network, there exist small **winning subnetworks** ("lottery tickets") that — when trained in isolation from the same initialization — match the full network's accuracy.

Formally, for a network $f(x; \theta)$ with mask $m \in \{0,1\}^{|\theta|}$, there exists a sparse subnetwork $f(x; m \odot \theta_0)$ such that after training:

$$
\mathcal{L}(f(x;\, m \odot \theta_T)) \approx \mathcal{L}(f(x;\, \theta_T))
$$

where $\theta_0$ are the initial weights and $\theta_T$ are the final weights.

This has practical implications: it suggests that large networks aren't necessary in principle — we just don't yet know how to find the right small network without first training the large one.

## Iterative Magnitude Pruning (IMP)

The standard recipe:

1. Train the full network to convergence: $\theta_0 \to \theta_T$
2. Prune the $p\%$ of weights with smallest $|w|$, recording mask $m$
3. **Reset** remaining weights to $\theta_0$ (the lottery ticket initialization)
4. Retrain with mask $m$ fixed
5. Repeat from step 2

Each round removes more weights. Typical schedules prune 20% per round for 10–15 rounds, reaching 80–95% sparsity.

## Practical Considerations

| Factor | Structured | Unstructured |
|---|---|---|
| Hardware speedup | Immediate | Needs sparse ops |
| Accuracy at high sparsity | Harder | Easier |
| Implementation complexity | Low | Low |
| Common sparsity level | 30–70% | 70–99% |

For deployment on standard hardware, **structured pruning** is almost always preferable. For research studying the theoretical properties of sparsity, unstructured pruning is the go-to.

## Summary

Pruning works because neural networks are redundant by construction — training in high-dimensional spaces tends to produce solutions that generalize well but use far more capacity than necessary. Identifying and removing that redundancy is an active research area with direct impact on edge deployment, green AI, and our understanding of what networks actually learn.
