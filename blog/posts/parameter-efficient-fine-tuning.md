---
title: Parameter-Efficient Fine-Tuning: LoRA, ReFT, and Efficient Backpropagation
date: 2026-06-20
category: Machine Learning Acceleration
order: 3
tags: [PEFT, LoRA, fine-tuning]
description: An in-depth guide to low-rank adaptation, representation fine-tuning, multi-concept customization, and low-precision training optimization.
---

## Why Full Fine-Tuning Is Expensive

A pretrained model may be shared by many downstream tasks, but full fine-tuning creates a complete task-specific copy. Training also requires gradients, activations, and optimizer states. With Adam, the optimizer alone commonly stores two additional full-precision values per parameter.

Parameter-Efficient Fine-Tuning (PEFT) keeps most pretrained parameters frozen and learns a small task-specific state. It reduces training memory and storage per task, but different PEFT methods make different compromises in optimization, expressiveness, and inference latency.

## Prompt and Prefix Tuning

Prompt tuning learns a small set of continuous embedding vectors prepended to the input. Prefix tuning extends this idea by learning key/value-like prefix states that influence multiple Transformer layers.

The base language model remains frozen, so only a tiny parameter set is stored for each task. However, the learned prefix consumes part of the sequence or attention context, and very small models may not have enough capacity to follow a soft prompt. Prefix optimization can also be sensitive to initialization and reparameterization.

These methods are most attractive when many tasks share one backbone and the system can tolerate task-specific virtual tokens in the inference path.

## Adapters

An adapter inserts a small bottleneck network into each Transformer block:

$$
h' = h + W_{up}\,\sigma(W_{down}h).
$$

If the bottleneck dimension is much smaller than the hidden dimension, the trainable parameter count is low. Adapters are modular and easy to swap, but they add sequential operations to every block. Even a small parameter count can therefore produce noticeable inference latency.

This distinction is important: **parameter efficiency is not automatically execution efficiency**.

## LoRA: A Low-Rank Weight Update

LoRA assumes that the update needed for a downstream task has low intrinsic rank. Instead of training a dense update $\Delta W$, it learns two small matrices:

$$
W' = W + \Delta W,
\qquad
\Delta W = \frac{\alpha}{r}BA,
$$

where $A\in\mathbb R^{r\times d_{in}}$, $B\in\mathbb R^{d_{out}\times r}$, and $r$ is small.

A dense $d_{out}\times d_{in}$ update contains $d_{out}d_{in}$ trainable values. LoRA uses

$$
r(d_{in}+d_{out}),
$$

which is much smaller when $r\ll\min(d_{in},d_{out})$.

The pretrained matrix is frozen, and $B$ is often initialized to zero so that the initial model exactly matches the base model. The scale $\alpha/r$ separates update magnitude from rank.

LoRA is frequently applied to attention projections, though MLP and other linear layers can also be adapted. Target-module selection and rank allocation determine the balance between quality and memory.

## Why LoRA Has No Necessary Inference Overhead

After training, the low-rank product can be merged:

$$
W_{merged}=W+\frac{\alpha}{r}BA.
$$

Inference then uses the original dense layer with no extra branch. This is a major advantage over adapters. The trade-off is operational: if a server must switch among many LoRA modules per request, permanently merging each one is inconvenient. Serving systems may instead compute the low-rank branch dynamically or batch requests by adapter.

## Weight Fine-Tuning Versus Representation Fine-Tuning

LoRA changes the function by modifying weights. Representation Fine-Tuning (ReFT) instead intervenes on hidden states. A simplified low-rank intervention can be written as

$$
h' = h + R^T\bigl(\phi(Rh)-Rh\bigr),
$$

where $R$ projects the representation into a low-dimensional subspace, $\phi$ edits it there, and $R^T$ maps the intervention back.

This is useful when the desired behavior can be localized to a representation, position, layer, or spatial region. It also provides a different form of modularity: independent concepts can retain independent intervention modules rather than being combined into a single modified weight matrix.

## Multi-Concept Customization

Personalized text-to-image generation illustrates the difficulty of combining PEFT modules.

**Joint training** on all concepts is simple, but it requires all data to be available together. This is inconvenient for privacy, incremental updates, and independent ownership of concepts.

**LoRA fusion** combines independently trained weight updates. It can introduce concept interference, requires a fusion rule, and may need additional optimization. The resulting module may also lose the clean separability of the original concepts.

A representation-based alternative can divide the problem into two interventions:

- **Prompt-Aware Intervention (PAI):** edit each concept's text-encoder representation independently.
- **Region-Aware Intervention (RAI):** apply a concept-specific U-Net cross-attention intervention only inside its spatial mask.

Cross-attention is a useful target because its representation can exhibit lower effective rank than self-attention, making low-rank intervention more plausible.

## Why Region Scheduling Matters

Applying a spatial mask changes the normalization behavior of attention. Early in diffusion sampling, a small masked region can receive excessive attention mass, causing duplicated objects or local artifacts. A timestep-dependent softmax schedule gradually adjusts the strength of localized attention rather than enforcing the final intervention equally at every denoising step.

This is a general lesson for modular control: a mathematically local edit can have a global effect through normalization and iterative generation dynamics.

## Training Cost Is More Than Trainable Parameters

PEFT reduces parameter gradients but may still retain large activation tensors for backpropagation. Efficient training therefore also targets low-precision matrix multiplication and saved activations.

The Hadamard transform is useful because it spreads large outlier values across dimensions using only additions and subtractions in $O(n\log n)$ time. After rotation, a tensor often has a more quantization-friendly range.

Two backward paths have different structures:

- The **activation-gradient path** can benefit from Hadamard quantization and fast INT4 computation.
- The **weight-gradient path** can benefit from a Hadamard-domain low-rank approximation and INT8 computation.

Using one approximation for every gradient path is suboptimal. Their shapes, error sensitivity, and reuse patterns differ.

Layer-wise quantizer selection can also choose between per-token and per-tensor scaling based on measured quality and runtime. Per-token scales usually preserve outlier-heavy activations better, while per-tensor scales are simpler and faster.

## Comparing PEFT Methods

| Method | What is trained | Main strength | Main limitation |
|---|---|---|---|
| Prompt tuning | Input embeddings | Extremely small task state | Depends strongly on model scale |
| Prefix tuning | Continuous attention prefixes | Small storage per task | Uses context and adds inference state |
| Adapter | Bottleneck modules | Clean module swapping | Additional sequential latency |
| LoRA | Low-rank weight updates | Mergeable and broadly effective | Rank and target layers need tuning |
| ReFT | Low-rank representation edits | Local and compositional control | Intervention placement is task-specific |

## Practical Checklist

Before choosing a PEFT method, ask:

1. Must task modules be switched for every request?
2. Can the adaptation be merged into a static model?
3. Is storage, training memory, or serving latency the primary constraint?
4. Does the task require global behavioral change or local representation control?
5. Are activation memory and backward compute still dominant after freezing weights?

PEFT is best understood as a family of system-design choices. The trainable parameter count is only the first metric; module composition, activation storage, numerical precision, and serving behavior determine whether the method is efficient in practice.
