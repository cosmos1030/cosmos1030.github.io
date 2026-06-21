---
title: VPTQ: Extreme Low-Bit Vector Quantization for Large Language Models
date: 2026-06-21
category: Machine Learning Acceleration
order: 11
tags: [VPTQ, vector quantization, LLM compression]
description: How VPTQ combines vector codebooks, second-order error correction, residual quantization, and outlier handling for practical 2-bit LLM deployment.
---

## Why Two-Bit LLM Quantization Is Difficult

Large language models are expensive to deploy because every decoding step must repeatedly access billions of weights. A 70-billion-parameter model stored in FP16 needs roughly 140 GB for weights alone. Weight-only quantization reduces both capacity and bandwidth requirements without changing activation precision or retraining the complete model.

Moving from FP16 to 2-bit storage suggests an ideal $8\times$ compression. The difficulty is accuracy. Scalar quantization assigns every weight independently to one of only four values. Methods that remain strong at 3 or 4 bits can collapse when this representational bottleneck reaches 2 bits.

VPTQ, or Vector Post-Training Quantization, asks a different question: instead of giving each scalar weight two bits, can the same bit budget encode **groups of correlated weights** more effectively?

## The Limit of Scalar Quantization

For scalar quantization, each weight $w_i$ is approximated independently:

$$
\hat w_i=Q(w_i).
$$

At 2 bits, the quantizer has four levels. Even after optimizing the scale and zero point, every coordinate is restricted to a small one-dimensional grid. A value such as $0.73$ may become $1$, while $0.31$ becomes $0$. These errors are modest individually but accumulate across billions of parameters and many Transformer layers.

The deeper problem appears when weights are correlated. Consider pairs $(w_1,w_2)$ lying near a diagonal or several dense clusters. Scalar quantization constructs centroids only at Cartesian products of one-dimensional levels. It spends representational capacity on grid intersections where almost no data exist.

## Vector Quantization Uses the Joint Distribution

Vector quantization (VQ) groups $v$ weights into a vector and represents it by one learned codebook entry:

$$
Q(\mathbf w)=C_{i^*},
\qquad
i^*=\arg\min_i\|\mathbf w-C_i\|_2^2.
$$

If vector length is $v=2$ and a codebook contains $k=16$ centroids, each vector stores a 4-bit index. This is still 2 bits per weight:

$$
\frac{\log_2 16}{2}=2.
$$

Unlike a scalar grid, the 16 vector centroids may be placed freely at dense regions of the two-dimensional weight distribution. The bit budget is unchanged, but the representation matches the data geometry.

{{interactive:vector-quantization}}

## The Post-Training Quantization Objective

Let $W$ be a pretrained weight tensor and $\hat W=W+\Delta W$ its quantized version. A second-order expansion of the task loss gives

$$
\mathcal L(\hat W)-\mathcal L(W)
\approx g(W)^T\Delta W
+\frac12\Delta W^TH(W)\Delta W.
$$

A pretrained model is assumed to be near a local optimum, so $g(W)\approx0$. The relevant objective becomes

$$
\min_{\Delta W}\Delta W^TH\Delta W.
$$

The Hessian measures sensitivity. Error in a high-curvature direction causes a much larger loss change than the same Euclidean error in a flat direction. Quantization should therefore preserve sensitive weights more carefully rather than minimizing unweighted reconstruction error alone.

## A Practical Layer-Wise Hessian

Computing the Hessian of the complete LLM loss is impossible at deployment scale. GPTQ-style methods instead quantize one linear layer at a time. For calibration inputs $X$, define the local reconstruction objective

$$
\mathcal L_\ell=\|WX-\hat W X\|_F^2.
$$

Since $(W-\hat W)X=\Delta W X$, this objective is exactly quadratic in the weight error. Its Hessian is proportional to

$$
H=2XX^T.
$$

A small calibration set therefore supplies a tractable curvature approximation for each layer. The matrix describes which input-channel directions matter for preserving the layer output.

## Why Previous Extreme-Low-Bit Methods Struggle

Several earlier approaches expose different trade-offs.

- **GPTQ** is fast and Hessian-aware, but scalar representation becomes too restrictive at 2 bits.
- **GPTVQ** applies vector quantization to multiple columns jointly. Quantization error from earlier columns can contaminate the optimization of later columns, limiting practical vector length.
- **AQLM** uses powerful additive codebooks but requires expensive gradient-based optimization.
- **QuIP#** improves incoherence with transformations such as Hadamard rotation, but the transformation introduces inference work.

VPTQ is designed to preserve vector-codebook accuracy while keeping calibration and inference practical.

## Component 1: Channel-Independent Second-Order Optimization

Jointly quantizing a block of columns can cause error accumulation. Suppose columns $A$ and $B$ are processed together. Error $\epsilon_A$ from the first column alters the residual seen while quantizing $B$, and the combined error is propagated again to later columns.

VPTQ instead processes one column at a time. After quantizing column $q$, its error is corrected or propagated before moving to the next column. Under an approximate diagonal-dominance assumption, the second-order loss contribution for one column becomes

$$
\Delta\mathcal L_q
=\frac{\|\hat W_{:,q}-W_{:,q}\|_2^2}
{2[H^{-1}]_{qq}}.
$$

For a fixed column, $[H^{-1}]_{qq}$ is constant. Splitting the column into subvectors $v_j$ represented by centroids $C_{i_j}$ gives

$$
\|\hat W_{:,q}-W_{:,q}\|_2^2
=\sum_j\|v_j-C_{i_j}\|_2^2.
$$

The best code assignment is therefore ordinary nearest-centroid search:

$$
i_j^*=\arg\min_i\|v_j-C_i\|_2^2.
$$

This is an important simplification. Second-order optimization motivates the procedure, but codebook lookup itself remains fast Euclidean nearest-neighbor search.

## The Hessian Still Controls Error Propagation

The reduction to Euclidean centroid lookup does not make curvature irrelevant. After quantizing column $n$, define its error

$$
E_{:,n}=W_{:,n}-\hat W_{:,n}.
$$

The remaining columns are adjusted using entries of $H^{-1}$:

$$
W_{:,n:s+B}\leftarrow
W_{:,n:s+B}
-\frac{E_{:,n}}{[H^{-1}]_{nn}}
[H^{-1}]_{n,n:s+B}.
$$

Conceptually, nearest-centroid assignment selects the local discrete representation, while Hessian-aware propagation compensates future columns for the induced output error.

## Component 2: Hessian-Weighted Centroid Initialization

K-means is sensitive to centroid initialization, and ordinary K-means treats every vector equally. VPTQ assigns more influence to vectors associated with sensitive Hessian directions:

$$
\min_{\{C_j\}}
\sum_i h_{ii}\|w_i-C_{\sigma(i)}\|_2^2.
$$

For a fixed cluster, the weighted centroid is

$$
C_j=
\frac{\sum_{i:\sigma(i)=j}h_{ii}w_i}
{\sum_{i:\sigma(i)=j}h_{ii}}.
$$

Suppose two scalar examples are $0.04$ and $1.00$, with sensitivities $10.0$ and $0.2$. Their ordinary mean is $0.52$, but the weighted mean is approximately

$$
\frac{10(0.04)+0.2(1.00)}{10.2}
\approx0.059.
$$

The centroid remains close to the highly sensitive value. Codebook capacity is allocated according to expected loss damage, not only data frequency.

## Component 3: Residual Vector Quantization

A single codebook leaves a residual

$$
r=v-Q_1(v).
$$

Residual Vector Quantization (RVQ) compresses this error using a second, usually smaller codebook:

$$
\hat v=Q_1(v)+Q_2(v-Q_1(v)).
$$

Only two code indices are stored. For example, if the first centroid maps $[0.70,0.30]$ to $[0.72,0.28]$, the residual is $[-0.02,0.02]$. A small residual codebook may approximate it with $[-0.019,0.021]$, producing a final reconstruction of $[0.701,0.301]$.

RVQ creates a tunable rate-distortion trade-off. A small additional index can recover much of the error left by the primary codebook without greatly increasing effective bit width.

## Component 4: Outlier Elimination

A small fraction of weights or sensitive columns can dominate the representable range. If 99% of values lie in $[-0.5,0.5]$ but 1% reach magnitude 10, a shared codebook must waste centroids on the extreme range. Ordinary values then receive poor resolution.

VPTQ separates outliers into a dedicated codebook. The main codebook models the dense central distribution, while the outlier codebook models exceptional values. Hessian information helps identify which columns deserve this protected treatment.

The outlier fraction is a hyperparameter, often near 1%. Too few protected values leave the main codebook distorted; too many increase storage and reduce the compression benefit.

## End-to-End Quantization Procedure

For each linear layer, the workflow is:

1. Collect calibration activations and form the layer Hessian approximation.
2. Identify sensitive outlier columns and quantize them with a separate codebook.
3. Initialize the main codebook with Hessian-weighted K-means.
4. Quantize columns independently with nearest-centroid assignments.
5. Propagate each column's error using $H^{-1}$ information.
6. Optionally quantize the remaining residual using a second codebook.
7. Optionally perform lightweight layer-level re-optimization.

Layers can be processed independently, exposing parallelism during calibration.

At inference time, the model stores codebook indices and centroid tables instead of FP16 weights. Reconstruction is a codebook lookup integrated into the matrix-multiplication path. No runtime Hadamard transform is required.

## Understanding the Effective Bit Width

The nominal code index is not the entire storage cost. Effective bit width includes:

- Primary codebook indices
- Residual-codebook indices, if used
- Outlier indices and values
- Codebook centroid storage
- Grouping or scale metadata

For large matrices, codebook overhead is amortized across many vectors. Outlier and residual settings explain why configurations may report values such as 2.02 or 2.26 bits rather than exactly 2.00.

Comparisons should therefore use effective bits per weight, not only the primary index width.

## Experimental Results

The reported evaluation covers LLaMA-2, LLaMA-3, and Mistral models using WikiText-2 and C4 perplexity together with five zero-shot question-answering benchmarks.

For LLaMA-2 7B near 2 bits, the presentation reports:

| Method | Effective bits | WikiText-2 PPL | C4 PPL | Avg. QA | Throughput |
|---|---:|---:|---:|---:|---:|
| FP16 | 16.00 | 5.12 | 6.63 | 62.2 | 38.32 tok/s |
| GPTQ | 2.125 | 50.75 | 36.76 | 39.16 | 19.59 tok/s |
| AQLM | 2.02 | 6.64 | 8.56 | 56.5 | 19.4 tok/s |
| VPTQ | 2.02 | 6.13 | 8.07 | 58.2 | 39.9 tok/s |
| VPTQ | 2.26 | 5.95 | 7.87 | 59.4 | 35.7 tok/s |

At a similar 2.02-bit budget, VPTQ improves perplexity over AQLM while approximately doubling the reported throughput. It also avoids the severe collapse visible in scalar GPTQ.

The gap becomes especially visible on newer model families. At roughly 2 bits, competing scalar approaches can produce unusable perplexity, while VPTQ retains substantially stronger LLaMA-3 and Mistral performance.

## Speed and Accuracy Are Co-Designed

An accurate compression format is not automatically a fast inference format. VPTQ's design deliberately avoids expensive runtime transforms and limits reconstruction to codebook lookup. The presentation reports roughly $1.6$--$1.8\times$ inference acceleration over prior extreme-low-bit methods and much shorter quantization time than gradient-heavy AQLM configurations.

Actual speed depends on kernel support, batch size, memory bandwidth, vector length, and codebook layout. A method can reduce weight storage but lose the benefit through irregular gathers or dequantization overhead. VPTQ's algorithm and representation must therefore be evaluated together with its kernels.

## Relationship to Scalar GPTQ

VPTQ and GPTQ share the same second-order foundation:

- Both use calibration activations to approximate layer sensitivity.
- Both process weights layer by layer.
- Both compensate later weights for earlier quantization errors.

Their main difference is the discrete representation. GPTQ chooses scalar levels; VPTQ chooses learned vector centroids and adds Hessian-weighted initialization, residual codebooks, and explicit outlier separation.

VPTQ can be understood as extending second-order PTQ from **which scalar value should replace this weight?** to **which learned vector prototype should replace this correlated group, and how should the resulting error be compensated?**

## Limitations

VPTQ does not make 2-bit deployment free.

- Calibration still requires representative activation data.
- Codebook quality and hyperparameters affect accuracy.
- Optional fine-tuning of very large models requires substantial GPU resources.
- Specialized inference kernels are needed to realize throughput gains.
- Results can vary across architectures, tasks, and context lengths.
- Outlier and residual metadata reduce the difference between nominal and effective bit width.

The method is most compelling when memory bandwidth and model capacity are primary deployment constraints and appropriate lookup-based kernels are available.

## Final Takeaways

1. Scalar 2-bit quantization fails because four independent levels cannot represent diverse, correlated weight distributions.
2. Vector quantization spends the same bit budget on learned joint prototypes located where weights actually cluster.
3. Channel-independent processing limits error accumulation and makes nearest-centroid assignment practical.
4. Hessian-weighted initialization reserves codebook accuracy for loss-sensitive directions.
5. Residual VQ buys a large reconstruction improvement with a small index overhead.
6. Outlier elimination prevents a tiny extreme subset from wasting the main codebook's range.
7. Inference-aware design matters as much as compression quality: lookup-friendly representations are what turn low bit width into real throughput.

VPTQ's central lesson is that extreme quantization is not only about using fewer bits. It is about choosing a discrete representation that matches weight geometry, allocating error according to loss sensitivity, and ensuring that the resulting format maps efficiently to hardware.
