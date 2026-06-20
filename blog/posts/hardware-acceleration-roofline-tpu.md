---
title: Hardware Acceleration: Roofline Analysis, CNN Dataflow, and Systolic Arrays
date: 2026-06-20
category: Machine Learning Acceleration
order: 10
tags: [hardware acceleration, TPU, roofline]
description: A detailed study of data movement, roofline analysis, convolution loop mapping, local memory, systolic arrays, HBM, and numerical formats.
---

## Data Movement Is the First-Class Cost

Deep-learning workloads contain many multiply-accumulate operations, but arithmetic is only part of their cost. Fetching a value from off-chip memory can consume far more energy and time than multiplying it. An accelerator is effective when it reuses weights and activations near the processing elements instead of repeatedly moving them through the memory hierarchy.

This changes the design question from "How many MAC units can fit?" to "Can data be supplied quickly enough to keep those MAC units busy?"

## Roofline Analysis

Arithmetic intensity, also called the computation-to-communication ratio, is

$$
I=\frac{\text{operations}}{\text{bytes transferred from external memory}}.
$$

If peak compute is $P_{peak}$ and memory bandwidth is $B$, attainable performance is bounded by

$$
P\le\min(P_{peak},BI).
$$

At low intensity, performance grows with $BI$: the workload is memory-bound. At high intensity, it reaches the horizontal compute roof. The intersection $P_{peak}/B$ is the ridge point.

Increasing MAC count helps only on the compute-bound side. Tiling, fusion, compression, and reuse increase effective arithmetic intensity by reducing external traffic. Lower precision can improve both roofs: more arithmetic units may operate per cycle, and more values fit in each byte of bandwidth.

## The Convolution Loop Nest

A convolution can be represented as

$$
O[m,r,c] += W[m,n,i,j]\,I[n,Sr+i,Sc+j],
$$

with loops over output channel $m$, input channel $n$, output position $(r,c)$, and kernel position $(i,j)$.

Large feature maps and weights rarely fit entirely on chip, so the loops are tiled. Tile sizes determine local-buffer capacity, reuse, boundary handling, and bandwidth demand.

## Loop Unrolling Creates a Hardware Architecture

Unrolling maps loop iterations onto parallel processing elements (PEs). The chosen dimension determines which values can be broadcast and which results need reduction.

### Output-Channel Unrolling

Several PEs compute different $m$ values at the same spatial location. They share the same input activation but use different weights.

- Benefit: input broadcast and reuse.
- Cost: high weight bandwidth and separate output accumulators.

### Input-Channel Unrolling

Several PEs compute contributions from different $n$ values to one output.

- Benefit: parallel channel accumulation.
- Cost: partial sums must be combined through an adder tree or reduction network.

### Spatial Unrolling

Several PEs compute adjacent $(r,c)$ outputs. Neighboring convolution windows overlap heavily.

- Benefit: input-window reuse.
- Cost: line buffers, sliding-window logic, and careful boundary handling.

### Kernel Unrolling

PEs compute multiple $(i,j)$ taps for the same output.

- Benefit: fast local dot product.
- Cost: many multipliers and a reduction tree whose size grows with the kernel.

Loop unrolling is therefore not a purely compiler-level optimization. It determines the PE array shape, broadcast network, memory banking, and accumulation structure.

## Reading Dependency Relations

For a loop variable and an array access, three relationships are useful:

- **Irrelevant:** the variable does not appear in the address, so the same value can be broadcast.
- **Independent:** iterations access distinct elements, suggesting banked or partitioned storage.
- **Reduction-dependent:** iterations contribute to the same logical output, requiring accumulation.

For example, input $I[n,Sr+i,Sc+j]$ is irrelevant to output channel $m$, so unrolling $m$ supports input broadcast. Output $O[m,r,c]$ is irrelevant to $n$, meaning unrolled input channels all update the same result and require reduction.

This analysis translates loop algebra directly into interconnect and memory requirements.

## Local Memory Promotion

If a value is reused inside an inner loop, it should be loaded into a closer memory level outside that loop. This is local memory promotion.

For each candidate tile, an accelerator designer estimates:

- Input, weight, and output-buffer capacity.
- Number of off-chip transfers.
- PE utilization.
- Required bandwidth per cycle.
- Accumulation and control overhead.

A tile that maximizes reuse may be too large for the buffer. A tile that perfectly fills the PE array may demand more bandwidth than memory can provide. Design-space exploration searches these interacting constraints rather than optimizing one metric in isolation.

## From Matrix-Vector to Matrix-Matrix Reuse

Inference for one input can resemble repeated matrix-vector multiplication, where a large weight matrix is read for relatively little work. Batching turns it into matrix-matrix multiplication: the same weights serve many inputs, raising arithmetic intensity.

This explains why datacenter accelerators favor batching, while latency-critical workloads can remain bandwidth-bound. It also motivates keeping weights stationary near compute when possible.

## Systolic Arrays

A systolic array is a regular grid of PEs where values move between neighbors in a pipelined rhythm. For matrix multiplication, one operand can flow horizontally, another vertically, and partial sums can remain stationary or move according to the selected dataflow.

The advantages are:

- Short, local communication rather than global broadcasts.
- Regular control and wiring.
- High reuse as values pass through multiple PEs.
- Deep pipelining with many operations in flight.

The array must first fill and later drain, so small or irregular matrices can underutilize it. Padding, tiling, and batching are needed to match workload shapes to the physical array.

## TPU and the Memory Wall

Google's TPU was designed for high-throughput neural-network inference in datacenters. A large matrix unit accelerated dense operations, but compute capability alone did not eliminate the weight-bandwidth bottleneck. If external DDR could not feed the array, PEs stalled.

Later systems adopted higher-bandwidth memory and training-oriented numerical formats. HBM provides multiple memory channels close to the processor, greatly increasing bandwidth, though capacity, packaging, and cost remain constraints.

This evolution demonstrates a recurring pattern: accelerating one stage exposes the next bottleneck. A faster matrix unit increases pressure on memory, interconnect, input pipelines, and host scheduling.

## FP16 and BF16

Low-precision formats improve storage, bandwidth, and compute density. IEEE FP16 allocates more bits to the mantissa but has a narrow exponent range. BF16 uses the same 8-bit exponent size as FP32 and a shorter mantissa.

BF16 therefore preserves dynamic range, which is valuable for gradients and activations, while accepting lower local precision. Accumulation is commonly performed in FP32 even when multiplication uses BF16 or FP16.

Choosing a format is not only a question of nominal bit width. Exponent range, rounding behavior, accumulation precision, and hardware throughput all affect model quality and performance.

## Real-World Accelerator Constraints

Autonomous-driving systems illustrate a different deployment environment from a datacenter. The accelerator must process multiple cameras at a fixed frame rate under strict power, thermal, and latency limits. Shared-backbone or multi-head networks can reuse features across tasks, reducing duplicated computation, but scheduling and worst-case latency are critical.

Peak benchmark throughput is insufficient. The system must sustain its required workload while moving sensor data, running preprocessing and postprocessing, and meeting real-time deadlines.

## Final Design Checklist

1. Is the target layer compute-bound or memory-bound?
2. Which tensor has the greatest reuse opportunity?
3. Which loop should be unrolled, and what broadcast or reduction does it require?
4. Which tile sizes fit the local buffers?
5. Can memory bandwidth sustain the PE consumption rate?
6. Do workload dimensions fill the physical array?
7. Does lower precision preserve enough range and accuracy?
8. What end-to-end latency and utilization are achieved, not merely peak TOPS?

Hardware acceleration is the co-design of computation, dataflow, memory, precision, and workload shape. A powerful arithmetic array matters only when the rest of the system can keep it supplied with useful data.
