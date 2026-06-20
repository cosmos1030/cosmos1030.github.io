---
title: Understanding the GPU and CUDA Execution Model
date: 2026-06-20
category: Machine Learning Acceleration
tags: [GPU, CUDA, parallel computing]
description: A detailed guide to SIMT execution, warps, occupancy, memory coalescing, tiling, and the performance principles behind CUDA kernels.
---

## Throughput Instead of Single-Thread Latency

A CPU dedicates substantial hardware to branch prediction, out-of-order execution, and large caches so that a small number of threads finish quickly. A GPU devotes more area to arithmetic units and runs many lightweight threads. When one group waits for memory, another can execute.

This design is effective when the same operation is applied to many independent data elements. Matrix multiplication, convolution, attention, and elementwise neural-network operations contain exactly this kind of parallelism.

The trade-off is that GPUs perform poorly when work is highly sequential, branches are irregular, or there are too few parallel tasks to occupy the machine.

## CUDA's Programming Hierarchy

CUDA organizes work as

$$
\text{grid}\rightarrow\text{block}\rightarrow\text{warp}\rightarrow\text{thread}.
$$

A kernel launch creates a grid of thread blocks. Blocks can be scheduled independently on streaming multiprocessors (SMs). Threads inside a block can communicate through shared memory and synchronize with a block-level barrier. Blocks generally cannot perform a cheap global synchronization inside a normal kernel.

This independence lets the same kernel scale across GPUs with different SM counts. The scheduler simply places more or fewer blocks concurrently.

## SIMD and SIMT

SIMD exposes vector lanes executing one instruction over multiple data values. CUDA exposes scalar-looking threads, but the hardware groups them into **warps**, typically 32 threads, that execute instructions together. This is Single Instruction, Multiple Threads (SIMT).

SIMT gives every thread its own registers, indices, and apparent control flow, while retaining efficient lockstep execution when threads follow the same path.

If threads in one warp take different branches, the hardware executes each path with a mask and disables threads that do not belong to that path. This **warp divergence** serializes branch paths. Divergence across separate warps is harmless; divergence within one warp is the problem.

## Latency Hiding and Occupancy

Global-memory access takes many cycles. GPUs hide this latency by keeping multiple active warps on each SM and switching to a ready warp when another stalls.

**Occupancy** is the ratio of active warps to the maximum supported by an SM. It is limited by:

- Threads per block
- Registers used per thread
- Shared memory used per block
- Hardware limits on resident blocks and warps

Higher occupancy can improve latency hiding, but maximum occupancy is not always optimal. A kernel that uses more registers to avoid repeated memory access may run faster despite lower occupancy. Occupancy is a resource diagnostic, not a final performance score.

## The GPU Memory Hierarchy

| Storage | Visibility | Main property |
|---|---|---|
| Registers | One thread | Fastest, but limited and may spill |
| Shared memory | One block | Fast on-chip, explicitly managed |
| L1 cache | SM/local | Small hardware-managed cache |
| L2 cache | Whole device | Shared among SMs |
| Global memory/HBM | Whole device | Large and high-bandwidth, but high-latency |
| Constant memory | Whole device | Efficient broadcast for uniform reads |

Register pressure can reduce occupancy. If too many registers are requested, values may spill into local memory, which is physically backed by global memory and much slower despite its name.

Shared memory is divided into banks. Threads accessing different banks can proceed in parallel, while conflicting addresses may serialize. Some broadcast patterns are handled efficiently, but the layout still matters.

## Coalesced Global Memory Access

Memory bandwidth is used efficiently when neighboring threads access neighboring addresses. The hardware combines these requests into a small number of aligned memory transactions. This is **coalescing**.

If thread $t$ reads `x[t]`, the access is naturally coalesced. If it reads a large-stride column of a row-major matrix, one warp may require many separate transactions. The amount of requested data can be small while the transferred data is large.

Data layout, thread indexing, and vectorized loads are therefore part of the algorithm. Transposing or tiling data can be faster even when it introduces extra arithmetic.

## Tiled Matrix Multiplication

Consider

$$
C_{ij}=\sum_k A_{ik}B_{kj}.
$$

A naive kernel repeatedly loads the same rows of $A$ and columns of $B$ from global memory. A tiled kernel proceeds as follows:

1. A block cooperatively loads tiles of $A$ and $B$ into shared memory.
2. Threads synchronize.
3. Each thread reuses tile values for many multiply-accumulate operations.
4. The block advances to the next $k$ tile.

Tiling increases arithmetic intensity: more operations are performed per byte fetched from HBM. It also enables coalesced global loads even when the mathematical access pattern contains a transpose.

Tile size is constrained by shared memory, registers, synchronization cost, and the dimensions supported efficiently by tensor cores.

## Convolution and Lowering

Convolution can be implemented by converting image patches into a matrix (im2col) and calling GEMM. This exposes highly optimized matrix multiplication but materializes duplicated data. Direct convolution avoids the expanded matrix but requires a specialized kernel.

Modern libraries choose among direct, implicit-GEMM, Winograd, FFT, and tensor-core algorithms depending on shape and hardware. The theoretically smallest operation count is not always fastest because workspace, memory traffic, and implementation quality differ.

## Arithmetic Intensity and the Roofline View

Arithmetic intensity is

$$
I=\frac{\text{operations}}{\text{bytes moved from memory}}.
$$

Low-intensity kernels are memory-bound; reducing FLOPs may not help if memory traffic stays constant. High-intensity kernels can become compute-bound and benefit from tensor cores or lower-precision arithmetic.

Batch size and fusion can change the regime. Fusing elementwise kernels avoids writing intermediate tensors to global memory. Larger GEMMs improve data reuse and hardware utilization.

## Synchronization and Atomics

Block-level barriers are safe only when all participating threads reach them. Placing a barrier in a divergent branch can deadlock or produce invalid behavior.

Atomic operations serialize conflicting updates to the same location. They are useful for reductions, histograms, and sparse updates, but contention can dominate. A common strategy is hierarchical reduction: combine values within a warp, then a block, and perform only a small number of global atomics.

## A Kernel Optimization Checklist

1. Is there enough parallel work to fill the GPU?
2. Are global loads and stores coalesced?
3. Is reused data placed in registers, shared memory, or cache?
4. Do branches diverge within warps?
5. Are register and shared-memory demands reducing occupancy too far?
6. Can adjacent operations be fused to avoid intermediate HBM traffic?
7. Does the chosen precision use an efficient hardware path?
8. Is synchronization or atomic contention limiting progress?

## Final Perspective

CUDA optimization is primarily the art of mapping work and data onto the machine. Thread count, memory layout, tile shape, and precision determine whether the GPU spends its time computing or waiting. Peak FLOPs describe what the hardware can do under ideal reuse; a kernel's data movement and execution regularity determine how much of that peak it actually reaches.
