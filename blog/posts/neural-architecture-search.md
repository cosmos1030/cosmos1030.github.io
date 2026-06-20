---
title: Neural Architecture Search: From RL Controllers to Once-for-All Networks
date: 2026-06-20
category: Machine Learning Acceleration
tags: [NAS, AutoML, model optimization]
description: A detailed guide to architecture search spaces, RL-based NAS, weight sharing, DARTS, Once-for-All networks, and predictor-based evaluation.
---

## What Neural Architecture Search Optimizes

Neural Architecture Search (NAS) automates decisions that were traditionally made by human experts: layer type, kernel size, channel width, connectivity, depth, and resolution. Every NAS method contains three components:

- **Search space:** the architectures that are allowed.
- **Search strategy:** the rule for selecting the next candidate.
- **Performance estimation:** the method used to predict how well a candidate will perform.

The third component is often the real bottleneck. Selecting an architecture is cheap; training it to convergence is not.

## Early Reinforcement-Learning NAS

In early RL-based NAS, a controller LSTM generated an architecture as a sequence of actions. A sampled child network was trained, and its validation accuracy became the reward. The controller was optimized with a policy-gradient estimator:

$$
\nabla_\theta J(\theta)
=\mathbb{E}_{a\sim\pi_\theta}
[(R(a)-b)\nabla_\theta\log\pi_\theta(a)],
$$

where $a$ is an architecture and $b$ is a variance-reducing baseline.

This formulation is conceptually clean: architecture is the action, training and evaluation form the environment, and accuracy is the reward. Its weakness is extreme sample cost. Every reward requires training a new child model, often nearly from scratch. Distributed evaluation reduces wall-clock time but not total computation.

## Cell-Based Search and Transferability

NASNet reduced the space by searching for reusable cells rather than a full network. A **normal cell** preserves resolution, while a **reduction cell** downsamples. The controller chooses inputs and operations for nodes inside each cell, and unused intermediate nodes are concatenated to form the cell output.

This has two benefits. First, the search problem becomes much smaller. Second, a cell found on a small dataset such as CIFAR can be stacked more times or given more channels when transferred to ImageNet. The method separates the discovered local computation pattern from the final network scale.

The limitation is that the cell-based prior may exclude unconventional global architectures. A smaller space is easier to search precisely because it encodes stronger human assumptions.

## Black-Box Alternatives

RL is only one search strategy. Other choices include:

- **Bayesian optimization:** fits a surrogate model of architecture performance and selects candidates using an acquisition function.
- **Evolutionary algorithms:** mutate and recombine high-performing architectures while removing weak ones.
- **CMA-ES:** adapts a sampling distribution, especially useful for continuous parameter spaces.
- **Simulated annealing:** occasionally accepts worse candidates to escape local optima.

Evolutionary NAS works naturally with discrete architectures and parallel evaluation. Bayesian methods are sample-efficient when a useful architecture representation and uncertainty model are available. None of them removes the fundamental cost of candidate evaluation by itself.

## ENAS and Weight Sharing

Efficient NAS (ENAS) represents the entire search space as one directed acyclic graph, or **supernet**. A child architecture is a sampled subgraph, and different children reuse the same weights.

Training alternates between two stages:

1. Fix the controller and update shared weights using sampled child networks on training data.
2. Fix the shared weights and update the controller using validation rewards.

Weight sharing avoids training every candidate independently. The cost reduction is dramatic, but the inherited-weight accuracy can be a noisy proxy for the candidate's true accuracy after standalone training. Operations sampled frequently may become better trained, creating a feedback loop that distorts the ranking.

## DARTS: Relaxing Discrete Choices

Differentiable Architecture Search (DARTS) replaces a hard choice among candidate operations with a softmax-weighted mixture:

$$
\bar{o}^{(i,j)}(x)
=\sum_{o\in\mathcal O}
\frac{\exp(\alpha_o^{(i,j)})}
{\sum_{o'\in\mathcal O}\exp(\alpha_{o'}^{(i,j)})}o(x).
$$

The network weights $w$ and architecture parameters $\alpha$ are optimized at different levels:

$$
\min_\alpha \mathcal L_{val}(w^*(\alpha),\alpha)
\quad\text{subject to}\quad
w^*(\alpha)=\arg\min_w\mathcal L_{train}(w,\alpha).
$$

After optimization, the strongest operation on each edge is selected to create a discrete architecture.

DARTS converts a combinatorial problem into gradient-based optimization, but the relaxation has costs. Every mixed edge evaluates multiple operations, increasing memory and computation. The continuous optimum may not remain optimal after discretization, and parameter-free operations such as skip connections can become over-selected because they optimize quickly.

## Once-for-All Networks

Device deployment introduces a different problem: the best network for a phone is not the best network for a server. Repeating NAS and training for every device is wasteful.

Once-for-All (OFA) trains a single supernet that supports elastic:

- Kernel sizes
- Network depths
- Channel widths
- Input resolutions

Its central technique is **progressive shrinking**. The largest network is trained first, followed by progressively smaller choices. This ordering gives the supernet a strong teacher and reduces interference among the enormous number of possible subnetworks.

At deployment time, measured latency or energy on the target device becomes a constraint. A search procedure selects a subnet that maximizes predicted accuracy under that constraint. No new gradient training is required for each device.

OFA moves NAS from pure accuracy search toward hardware-aware model specialization. It also makes an important distinction between theoretical FLOPs and measured device behavior: two subnetworks with similar FLOPs can have very different latency.

## Predictor-Based NAS

Another approach is to learn a performance predictor. An architecture can be encoded as a graph and processed by a graph neural network. Only a small set of architectures needs expensive full evaluation; the predictor cheaply ranks the rest.

A typical pipeline is:

1. Sample architectures and obtain true validation accuracy for a training subset.
2. Train a predictor from architecture representation to performance.
3. Score a large candidate pool cheaply.
4. Fully train only the most promising candidates.

The predictor must generalize to architectures outside its training sample. Its absolute prediction error is less important than whether it preserves a useful ranking near the top of the search space.

## Unsupervised and Self-Supervised Proxies

Labels make NAS evaluation even more expensive. If performance on a self-supervised proxy task correlates with supervised accuracy, the search can use unlabeled data. The key requirement is rank correlation: a proxy is valuable when architectures that perform well under the proxy also perform well on the final task.

This is not guaranteed. A proxy can favor invariances or feature properties that do not match the downstream objective, so correlation must be measured rather than assumed.

## Comparing the Main Approaches

| Method | How it reduces search difficulty | Main risk |
|---|---|---|
| RL-NAS | Learns a controller over discrete actions | Enormous candidate-training cost |
| Cell-based NAS | Searches a reusable local motif | Strong, potentially limiting search prior |
| ENAS | Shares weights in a supernet | Unreliable inherited-weight ranking |
| DARTS | Makes operation selection differentiable | Relaxation bias and high mixed-op memory |
| OFA | Reuses one elastic network across devices | Difficult supernet training |
| Neural predictor | Evaluates most candidates approximately | Predictor distribution shift |

## Final Perspective

NAS is not simply "letting AI design AI." It is an optimization problem under an expensive and noisy objective. Every successful method introduces a proxy: shared weights, continuous mixtures, smaller datasets, predictors, or elastic supernets. The central question is whether the proxy preserves the ranking that would have been obtained by fully training and measuring every architecture on the real target hardware.
