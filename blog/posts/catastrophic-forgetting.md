---
title: Catastrophic Forgetting in Fine-tuned Models
date: 2026-06-20
tags: [continual learning, fine-tuning, VLM]
description: Why fine-tuning a pretrained model tends to destroy its general capabilities, and what we can do about it.
---

## The Problem

When you fine-tune a pretrained model on a new task, it tends to forget what it knew before. This phenomenon is called **catastrophic forgetting**, and it is one of the central challenges in continual learning.

Formally, suppose a model is pretrained on a data distribution $\mathcal{D}_0$ and achieves good performance on tasks drawn from it. We then fine-tune on a new dataset $\mathcal{D}_1$. The concern is that after fine-tuning, performance on $\mathcal{D}_0$ degrades significantly — even though we never explicitly optimized to forget it.

## Why Does It Happen?

Neural networks store knowledge distributed across their weights. When gradient descent updates weights to minimize loss on $\mathcal{D}_1$, it has no mechanism to protect knowledge relevant to $\mathcal{D}_0$. From the optimizer's perspective, a weight update that helps on the new task is equally valid whether or not it overwrites something useful.

The degree of forgetting depends on the **overlap** between $\mathcal{D}_0$ and $\mathcal{D}_1$. If they share representations (e.g., both are natural images), the feature extractor may remain intact. If they are dissimilar, even early layers can shift significantly.

## The Plasticity–Stability Trade-off

There is a fundamental tension here. A model that updates rapidly to new tasks (**plastic**) will tend to forget old ones. A model that resists updates (**stable**) cannot learn new tasks well. This is known as the **plasticity–stability dilemma**.

Let $\theta$ be the model parameters. Ideally we want:

$$
\min_\theta \; \mathcal{L}_1(\theta) \quad \text{s.t.} \quad \mathcal{L}_0(\theta) \leq \mathcal{L}_0(\theta_0) + \epsilon
$$

where $\theta_0$ are the pretrained parameters. In practice this constraint is hard to enforce directly.

## Common Approaches

### Regularization-based

Add a penalty term that discourages parameters from moving too far from their pretrained values:

$$
\mathcal{L}(\theta) = \mathcal{L}_1(\theta) + \lambda \sum_i \Omega_i (\theta_i - \theta_i^0)^2
$$

The weight $\Omega_i$ measures how **important** parameter $i$ is to old tasks. Setting $\Omega_i = 1$ for all $i$ recovers simple L2 regularization (weight decay). More principled choices use the Fisher information matrix — this is the idea behind **Elastic Weight Consolidation (EWC)**.

### Replay-based

Maintain a buffer of examples from old tasks and interleave them with new task data during training. This keeps gradients from fully committing to the new distribution. Variants range from storing raw data (**experience replay**) to training a generative model to synthesize old examples (**generative replay**).

### Architecture-based

Allocate separate capacity for each task — e.g., by growing the network, using adapters, or masking subsets of weights per task. These avoid interference by construction but do not scale well when tasks accumulate.

## Forgetting in Large Vision-Language Models

The problem is especially acute in large VLMs. Pretrained on internet-scale data, these models acquire broad capabilities (OCR, spatial reasoning, commonsense, etc.). Fine-tuning on a narrow downstream task can rapidly erode this breadth.

A subtler issue is **hyperparameter sensitivity**: the rate of forgetting depends strongly on the learning rate, batch size, and number of steps — often in non-obvious ways. A learning rate that works well on the new task metric may silently destroy general capabilities.

One insight from our recent work is that **on-policy adaptation** — keeping the fine-tuning distribution close to the model's own output distribution — acts as a natural regularizer that reduces forgetting without explicit penalties. The intuition is that on-policy updates avoid large gradient steps that push parameters into regions far from the pretrained optimum.

## Summary

| Approach | Mechanism | Limitation |
|---|---|---|
| L2 / EWC | Penalize weight movement | Sensitive to $\lambda$; importance estimation is approximate |
| Replay | Revisit old data | Requires storing data; memory grows with tasks |
| Adapters / LoRA | Isolate new parameters | Pretrained backbone may still shift |
| On-policy adaptation | Constrain update distribution | Task-specific; needs careful distribution design |

Catastrophic forgetting is not a solved problem, but the combination of better regularization, data-efficient replay, and distribution-aware training is closing the gap.
