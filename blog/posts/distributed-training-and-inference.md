---
title: Distributed Training and Inference for Large Models
date: 2026-06-20
category: Machine Learning Acceleration
order: 8
tags: [distributed training, LLM, parallelism]
description: A detailed guide to data, tensor, and pipeline parallelism, sharded state, checkpointing, mixed precision, and disaggregated inference.
---

## Why Large Models Need Multiple Devices

Model parameters are only one part of training memory. A mixed-precision Adam training run may store low-precision parameters, full-precision master parameters, gradients, two optimizer moments, and layer activations. The total can greatly exceed the parameter file size.

Compute also scales with model size, token count, and sequence length. Distributed training addresses both capacity and time by partitioning different dimensions of the workload. No single parallelism strategy solves every bottleneck.

## Data Parallelism

In data parallelism, every worker holds a full model replica and processes a different minibatch shard. Local gradients are averaged with an all-reduce before the optimizer update:

$$
g=\frac{1}{N}\sum_{i=1}^{N}g_i.
$$

It is simple and scales throughput when the per-device batch remains large enough. The main limitations are full model-state replication and gradient communication.

Communication can be overlapped with backward computation by reducing a layer's gradients while earlier layers are still computing. Large gradient buckets improve bandwidth efficiency but delay overlap; small buckets introduce more collective overhead.

## ZeRO and Fully Sharded Data Parallelism

Sharded data parallelism removes replication progressively:

- Shard optimizer states.
- Shard gradients.
- Shard parameters.

With full parameter sharding, workers all-gather the parameters needed for the current layer and release them after use. Reduce-scatter distributes gradient shards to their owners.

This allows a much larger model to fit, but memory is exchanged for communication. Prefetching, communication overlap, parameter persistence, and wrapping granularity strongly influence performance.

## Tensor Parallelism

Tensor parallelism splits an individual operation across devices. For a linear layer $Y=XW$, a column-parallel split partitions the output columns of $W$:

$$
W=[W_1\;W_2\;\cdots\;W_p],
\qquad Y_i=XW_i.
$$

A row-parallel split partitions the reduction dimension and sums partial outputs:

$$
W=\begin{bmatrix}W_1\\W_2\\\vdots\\W_p\end{bmatrix},
\qquad Y=\sum_i X_iW_i.
$$

Careful pairing of column- and row-parallel layers can avoid unnecessary communication between adjacent projections. Nevertheless, tensor parallelism introduces collectives inside nearly every Transformer block. It works best over high-bandwidth, low-latency links within a node.

## Pipeline Parallelism

Pipeline parallelism assigns consecutive layer groups to stages. A batch is divided into microbatches so different stages can work concurrently.

At the beginning and end, some stages are idle while the pipeline fills or drains. This **pipeline bubble** becomes smaller relative to useful work as the number of microbatches grows. However, more microbatches can increase scheduling and activation overhead.

Stage balance is essential. The slowest stage determines throughput, so equal layer counts are not necessarily equal partitions. Embedding, attention, and output layers can have different costs.

Schedules such as one-forward-one-backward reduce the number of outstanding activations compared with running every forward microbatch before backward. Interleaved schedules can reduce bubbles further at the cost of more complex communication.

## Combining Parallel Dimensions

Large training runs commonly combine:

- Tensor parallelism within a fast interconnect domain.
- Pipeline parallelism across layer groups.
- Data parallelism across replicas of the model partition.

If the data, tensor, and pipeline degrees are $D$, $T$, and $P$, then the total device count is approximately $DTP$. The placement should reflect the communication pattern: frequent tensor collectives need the fastest links, while data-parallel synchronization can span a wider domain.

## Activation Checkpointing

Ordinary backpropagation stores intermediate activations from the forward pass. Activation checkpointing stores only selected boundaries and recomputes missing activations during backward.

The method exchanges additional computation for lower memory. Checkpointing every operation minimizes storage but maximizes recomputation. Segment-based policies find a middle ground. It is especially valuable at long sequence lengths where activation memory can dominate model state.

## Automatic Mixed Precision

Lower precision reduces tensor storage, communication volume, and arithmetic cost. FP16 has limited exponent range, so small gradients may underflow and large values may overflow. Loss scaling multiplies the loss before backward:

$$
\tilde{\mathcal L}=S\mathcal L.
$$

Gradients are divided by $S$ before the optimizer update. Dynamic loss scaling reduces $S$ after overflow and increases it after stable steps.

BF16 retains the FP32 exponent range with fewer mantissa bits, making it more robust for training and often eliminating explicit loss scaling. Numerically sensitive reductions, normalization statistics, and optimizer updates may still use FP32.

Automatic mixed precision is a graph transformation problem as well as a datatype choice: operators must be classified by numerical safety, and redundant casts should be minimized.

## Communication Versus Computation

Distributed scaling stops when added communication exceeds saved computation. Useful techniques include:

- Overlapping collectives with independent compute.
- Using reduce-scatter/all-gather instead of redundant all-reduce patterns.
- Increasing arithmetic per communication event.
- Keeping high-frequency communication within fast interconnects.
- Balancing partitions to prevent stragglers.

The network topology is part of the model configuration. A parallel plan that performs well on NVLink-connected GPUs may perform poorly across slower inter-node links.

## Prefill and Decode Have Different Needs

LLM inference contains two phases.

**Prefill** processes all prompt tokens in parallel. Its large matrix multiplications usually make it compute-bound, and batching improves utilization.

**Decode** generates one token per request per step. It reads model weights and a growing KV cache for comparatively little arithmetic, so it is often memory-bandwidth-bound.

Colocating both phases on the same workers leads to interference. Long prefills can delay decode requests, while decode-oriented batching may underutilize compute during prefill.

## Disaggregated Inference

Disaggregated serving assigns prefill and decode to separate worker pools. After prefill, the KV cache is transferred to a decode worker.

Benefits include independent batching, hardware specialization, and better isolation of time-to-first-token from inter-token latency. Costs include KV-transfer bandwidth, scheduling complexity, load imbalance, and failure handling.

Disaggregation is worthwhile only when the phase-specific utilization gain exceeds the cache-transfer and coordination cost. Prompt length, generation length, cache size, and network bandwidth all affect the result.

## Final Comparison

| Technique | Primary resource saved | Primary cost introduced |
|---|---|---|
| Data parallelism | Training time | Replicated state and gradient sync |
| FSDP/ZeRO | Model-state memory | Parameter communication |
| Tensor parallelism | Per-device operator memory | Frequent collectives |
| Pipeline parallelism | Per-device layer memory | Bubbles and stage communication |
| Checkpointing | Activation memory | Recomputation |
| Mixed precision | Memory, bandwidth, arithmetic | Numerical risk |
| Disaggregated inference | Phase-specific utilization | KV transfer and scheduling |

Distributed systems optimize a chain, not an isolated kernel. The best configuration keeps computation, memory, and communication balanced while respecting the physical topology of the cluster.
