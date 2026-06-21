---
title: Neural Network Quantization: From Binary Networks to LLM Weight-Only Methods
date: 2026-06-20
category: Machine Learning Acceleration
order: 6
tags: [quantization, model compression, LLM]
description: An in-depth guide to quantization error, QAT and PTQ, mixed precision, activation outliers, GPTQ, SmoothQuant, AWQ, and weight-only inference.
---

## What Quantization Changes

Quantization maps high-precision values to a finite set of low-precision levels. It can reduce model storage, memory bandwidth, arithmetic cost, and energy. These benefits are separate: a smaller file does not automatically imply faster execution unless the target hardware has efficient low-bit kernels.

Uniform affine quantization is commonly written as

$$
q=\operatorname{clip}
\left(\operatorname{round}(x/s)+z,q_{min},q_{max}\right),
$$

with dequantization

$$
\hat{x}=s(q-z).
$$

The scale $s$ controls level spacing, and zero point $z$ makes real zero exactly representable. Symmetric quantization usually fixes $z=0$ and is simpler for hardware; asymmetric quantization uses the integer range more efficiently for shifted distributions such as ReLU activations.

{{interactive:quantization}}

## Rounding Error Versus Clipping Error

Selecting the representable range creates a fundamental trade-off. A wide range includes outliers but increases the distance between neighboring levels, producing more rounding error for ordinary values. A narrow range improves resolution near zero but clips large values.

This is why min-max calibration is often inferior to a calibrated threshold. TensorRT-style calibration can choose a threshold by minimizing KL divergence between the original activation histogram and its quantized approximation. The best range is the one that preserves relevant information, not necessarily every extreme value.

Granularity matters too:

- **Per-tensor:** one scale for an entire tensor; simple and fast.
- **Per-channel:** one scale per output channel; usually more accurate for weights.
- **Per-group:** a compromise common in low-bit LLM weights.
- **Per-token:** useful for activation distributions that vary strongly between tokens.

## PTQ and QAT

Post-Training Quantization (PTQ) quantizes an already trained model using a small calibration set. It is cheap and data-efficient but becomes difficult at very low precision.

Quantization-Aware Training (QAT) inserts fake quantizers during training so the model can adapt. Since rounding has zero derivative almost everywhere, the straight-through estimator approximates

$$
\frac{\partial\operatorname{round}(x)}{\partial x}\approx1
$$

inside a chosen range. Forward computation experiences quantization noise, while backward computation uses a surrogate gradient.

PACT learns an activation clipping bound $\alpha$, controlling range. LSQ learns the quantization step size $s$, directly balancing resolution and clipping. These are related but not identical controls.

## Binary and Logarithmic Quantization

For binary weights, a vector $W$ is approximated by $\alpha B$ with $B\in\{-1,+1\}^n$. Minimizing squared error gives

$$
B^*=\operatorname{sign}(W),
\qquad
\alpha^*=\frac{1}{n}\|W\|_1.
$$

Binary multiplication can be implemented with XNOR and popcount. Training usually keeps latent full-precision weights for updates while using binary weights in forward and backward computation. Binarizing activations as well as weights causes much larger accuracy loss because intermediate representations need dynamic range.

Logarithmic quantization places levels densely near zero and sparsely at large magnitudes. Multiplication by a power of two becomes a bit shift. It matches heavy-tailed distributions better than uniform spacing, but irregular level decoding and hardware support can offset the theoretical advantage.

## Learned and Mixed Precision

Different layers have different sensitivity. Early vision layers can be sensitive because they directly process input structure; bottlenecks or layers with high curvature may also be fragile.

Near a trained optimum, the loss change caused by weight perturbation $\Delta W$ is approximately

$$
\Delta\mathcal L\approx
\frac12\Delta W^TH\Delta W.
$$

HAWQ uses Hessian information, often a trace estimated with Hutchinson's method,

$$
\operatorname{Tr}(H)
=\mathbb E_z[z^THz],
$$

to identify sensitive layers. A bit-allocation procedure then assigns more precision where quantization would increase the loss most, under a total model-size constraint.

## Why LLM Activations Are Difficult

Large language models often contain rare but very large activation values concentrated in particular channels. A shared INT8 or INT4 scale must include those outliers, leaving few effective levels for the majority of values.

Several methods address this in different ways:

- **LLM.int8():** detect outlier dimensions and compute them in higher precision while quantizing the rest.
- **SmoothQuant:** apply an equivalent rescaling that moves quantization difficulty from activations into weights.
- **Outlier-aware quantization:** store a small fraction of exceptional values or columns separately.

SmoothQuant exploits the invariance of a linear layer. For a diagonal scaling matrix $S$,

$$
XW=(XS^{-1})(SW).
$$

Choosing $S$ can shrink activation outliers while increasing the corresponding weight magnitude. Weights are static and easier to quantize per channel, so this migration can make W8A8 inference practical.

## Weight-Only Quantization

Autoregressive decode often uses small batches and repeatedly streams model weights from HBM. It is memory-bound rather than compute-bound. Compressing weights from FP16 to INT4 approximately quarters weight traffic, while activations can remain in FP16/BF16.

This makes weight-only quantization especially practical for LLM serving. The GPU loads packed weights, dequantizes them inside or near the matrix-multiplication kernel, and accumulates at higher precision. The speedup depends on whether reduced memory traffic exceeds unpacking and dequantization overhead.

## GPTQ and Second-Order Error Compensation

Naively rounding each weight independently ignores interactions among columns. GPTQ/OPTQ quantizes weights sequentially and uses approximate Hessian information to compensate for the error in the remaining unquantized weights.

Conceptually, after quantizing one weight or column, the method adjusts the rest so the layer output changes as little as possible on calibration activations. This makes 3-bit and 4-bit PTQ substantially more accurate than independent rounding, though calibration quality and Hessian approximation matter.

## AWQ, OWQ, and Protecting Important Channels

Activation-Aware Weight Quantization (AWQ) observes that a small fraction of weight channels are especially important when their corresponding activation magnitudes are large. It searches for per-channel scaling that protects these weights while keeping a regular low-bit representation.

Outlier-aware Weight Quantization (OWQ) identifies weak or sensitive columns and preserves them at higher precision. The majority remains low-bit. This mixed representation spends precision where error has the largest effect rather than treating every column equally.

## A Practical Comparison

| Method | Setting | Central idea |
|---|---|---|
| TensorRT calibration | INT8 PTQ | Choose a clipping threshold by distribution matching |
| PACT | QAT | Learn activation range |
| LSQ | QAT | Learn quantization step size |
| HAWQ | Mixed precision | Allocate bits using second-order sensitivity |
| LLM.int8() | W8A8-like inference | Separate activation outliers |
| SmoothQuant | W8A8 PTQ | Move activation difficulty into weights |
| GPTQ | Weight-only PTQ | Sequential second-order error compensation |
| AWQ | Weight-only PTQ | Protect activation-salient channels |
| OWQ | Mixed weight precision | Keep sensitive columns in high precision |

## Final Perspective

Quantization is an error-allocation problem. Precision can be allocated across ranges, channels, groups, layers, and even individual outlier columns. The best numerical approximation is not always the fastest system, so a complete evaluation must report accuracy, model size, peak memory, kernel support, throughput, and end-to-end latency on the intended hardware.
