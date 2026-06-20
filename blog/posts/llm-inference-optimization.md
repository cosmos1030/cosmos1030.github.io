---
title: LLM Inference Optimization: Attention, KV Caches, and Speculative Decoding
date: 2026-06-20
category: Machine Learning Acceleration
tags: [LLM, inference, FlashAttention]
description: An in-depth study of FlashAttention, PagedAttention, GQA, RoPE, MLA, and exact speculative decoding for efficient LLM serving.
---

## One Workload, Several Bottlenecks

LLM inference optimization is easier to understand when each technique is tied to a specific bottleneck:

- Attention creates large intermediate tensors and HBM traffic.
- Autoregressive generation requires a growing KV cache for every request.
- Variable sequence lengths fragment memory and complicate batching.
- One-token-at-a-time decoding creates unavoidable sequential latency.

No single optimization addresses all four.

## Standard Attention and Its I/O Cost

Scaled dot-product attention is

$$
O=\operatorname{softmax}\left(\frac{QK^T}{\sqrt d}\right)V.
$$

A conventional implementation writes the $N\times N$ score matrix to HBM, reads it for softmax, writes probabilities, and reads them again for multiplication by $V$. For long sequences, this materialization can dominate runtime even if the mathematical FLOPs remain unchanged.

## FlashAttention

FlashAttention tiles $Q$, $K$, and $V$ so that blocks fit in fast on-chip SRAM. It computes attention outputs incrementally without storing the entire attention matrix.

The challenge is softmax normalization across multiple key tiles. For scores $s_i$, softmax depends on the global maximum and sum. An online algorithm maintains a running maximum $m$ and normalization $l$. When a new tile has maximum $m'$, old contributions are rescaled by $e^{m-m'}$ before new contributions are added.

This produces exact attention up to normal floating-point effects. FlashAttention changes the execution order, not the attention definition.

During backward, it recomputes score blocks instead of storing the full matrix from forward. This is a compute-memory trade-off: a modest amount of repeated arithmetic avoids much larger HBM traffic.

## Why the KV Cache Exists

At decode step $t$, recomputing keys and values for all previous tokens would repeat nearly identical work. Each layer therefore stores

$$
K_{1:t},V_{1:t}
$$

and computes only the new token's query, key, and value. Attention compares the new query against cached keys and reads cached values.

Cache size grows with batch size, sequence length, layer count, KV-head count, head dimension, and bytes per element. A large model serving many long requests can spend more memory on KV cache than on temporary activations.

## Fragmentation and PagedAttention

Requests have different prompt and output lengths. Reserving each request's maximum possible cache wastes unused space, while requiring contiguous expansion leads to allocation failures and copying.

PagedAttention divides KV storage into fixed-size blocks. A block table maps each request's logical token blocks to non-contiguous physical blocks. New blocks are allocated only when needed and returned when a sequence completes.

This resembles virtual-memory paging, but the objective is GPU cache utilization rather than disk-backed memory. It reduces fragmentation, enables cache sharing for common prefixes or parallel samples, and supports larger effective batches.

The attention kernel must follow block-table indirections, so block size balances metadata overhead, locality, and internal waste.

## MHA, MQA, and GQA

Multi-Head Attention gives every query head its own key and value heads. Multi-Query Attention shares one K/V pair among all query heads. Grouped-Query Attention uses an intermediate number of K/V heads, with several query heads sharing each pair.

| Type | Query heads | KV heads | Cache/quality tendency |
|---|---:|---:|---|
| MHA | $H$ | $H$ | Largest cache, maximum head freedom |
| GQA | $H$ | $G$, $1<G<H$ | Balanced compromise |
| MQA | $H$ | $1$ | Smallest cache, strongest sharing |

Because KV cache scales with KV-head count, GQA can reduce cache by the sharing factor. This is a model-architecture optimization, unlike PagedAttention, which improves allocation of whatever cache the model requires.

## RoPE and Relative Position

Rotary Position Embedding rotates pairs of query and key dimensions by a position-dependent angle. If $R_t$ is the rotation at position $t$, then

$$
(R_tq)^T(R_sk)=q^TR_{s-t}k.
$$

The dot product depends on the relative position $s-t$. RoPE inserts position directly into the attention geometry without adding a separate positional vector to the residual stream.

Long-context extrapolation remains sensitive to the trained frequency range, so practical systems may rescale or modify RoPE frequencies.

## Multi-Head Latent Attention

MLA reduces KV storage more aggressively by caching a low-dimensional latent representation rather than full per-head keys and values. At inference time, projections reconstruct the components needed for attention.

RoPE complicates this compression because position-dependent rotation may prevent the key projection from being absorbed cleanly into other matrices. MLA separates a small positional key component from the compressed content component. This **decoupled RoPE** preserves relative position while keeping most cached state low-rank.

The comparison is:

- GQA reduces KV heads through sharing.
- MLA compresses KV content into a latent state.
- PagedAttention manages the resulting cache blocks efficiently.

These methods can be complementary.

## Speculative Decoding

Autoregressive dependency prevents the target model from generating several unknown future tokens in parallel. Speculative decoding uses a cheap draft distribution $q$ to propose $\gamma$ tokens, then evaluates the large target $p$ on the entire proposed prefix in one pass.

Each draft token $x$ is accepted with probability

$$
\min\left(1,\frac{p(x)}{q(x)}\right).
$$

If a token is rejected, sampling continues from the corrected distribution

$$
p'(x)\propto\max(0,p(x)-q(x)).
$$

This rejection-sampling construction preserves the exact target distribution. Greedily accepting draft tokens would not.

## What Determines Speculative Speedup?

Let $\alpha$ be average acceptance probability, $c$ the draft cost relative to one target step, and $\gamma$ the number of proposed tokens. High $\alpha$ means more tokens are confirmed per target call. Low $c$ means speculation is cheap.

Increasing $\gamma$ helps only while later proposed tokens remain likely to be accepted. A long rejected suffix wastes draft computation. The optimal value depends on request batch size, target parallelism, and draft-target agreement.

Draft designs include independent smaller models, early-exit layers of the target, multiple prediction heads, and tree-shaped candidate verification. They share the same principle: perform cheap sequential guesses and expensive parallel verification.

## Throughput Versus Latency

PagedAttention and KV-sharing techniques primarily permit larger batches and improve aggregate throughput. Speculative decoding primarily reduces the number of target-model calls on a single generation path. FlashAttention can improve both training and inference attention kernels, but decode attention may still be memory-bound because the query length is one.

An optimization can improve throughput while hurting inter-token latency, or vice versa. Serving evaluations should therefore separate:

- Time to first token
- Inter-token latency
- Requests or tokens per second
- Peak and average KV memory
- Performance at realistic prompt/output length distributions

## Final Map

| Technique | Layer of the problem | What it reduces |
|---|---|---|
| FlashAttention | Kernel algorithm | Attention HBM I/O |
| PagedAttention | Memory management | KV fragmentation and reservation waste |
| GQA/MQA | Model architecture | Number of cached K/V heads |
| MLA | Model architecture | Dimensionality of cached K/V state |
| RoPE | Position representation | Adds relative position without additive embeddings |
| Speculative decoding | Decoding algorithm | Sequential target-model calls |

Efficient LLM serving is a stack. The model defines how much state exists, the memory manager determines how it is placed, kernels determine how it is moved, and the decoding algorithm determines how often the model must run.
