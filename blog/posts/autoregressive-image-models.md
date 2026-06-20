---
title: Autoregressive Image Models: From VAE and VQ-VAE to Fast Decoding
date: 2026-06-20
category: Machine Learning Acceleration
tags: [autoregressive models, VQ-VAE, image generation]
description: A detailed study of latent image tokenization, DALL-E-style generation, continuous tokens, and grouped speculative decoding.
---

## Modeling an Image as a Sequence

An autoregressive (AR) image model decomposes the joint distribution of image tokens into conditional probabilities:

$$
p(x_1,\ldots,x_N)=\prod_{i=1}^{N}p(x_i\mid x_{<i}).
$$

The formulation is identical to next-token language modeling. Once an image is represented as a sequence, a causal Transformer can reuse mature LLM components such as KV caching, sampling strategies, and distributed serving.

The disadvantage is also inherited from language models: generation is sequential. Images can require hundreds or thousands of latent tokens, and a partial image token stream is less useful to a user than streaming text. Tokenization and decoding speed are therefore central parts of the model, not implementation details.

## Why a Plain Autoencoder Is Not Enough

A deterministic autoencoder maps $x$ to a latent code $z=f(x)$ and reconstructs it with $\hat{x}=g(z)$. It can compress data, but it does not automatically define a well-behaved density from which new latent values can be sampled. The encoded examples may occupy an irregular low-dimensional manifold with large empty regions.

A Variational Autoencoder (VAE) instead defines a probabilistic encoder $q_\phi(z\mid x)$ and decoder $p_\theta(x\mid z)$. It optimizes the evidence lower bound:

$$
\log p_\theta(x)\ge
\mathbb E_{q_\phi(z\mid x)}[\log p_\theta(x\mid z)]
-D_{KL}(q_\phi(z\mid x)\|p(z)).
$$

The reconstruction term preserves information about $x$. The KL term regularizes the posterior toward a simple prior, usually $\mathcal N(0,I)$, so that sampling becomes meaningful.

Sampling is made differentiable with the reparameterization trick:

$$
z=\mu_\phi(x)+\sigma_\phi(x)\odot\epsilon,
\qquad \epsilon\sim\mathcal N(0,I).
$$

Randomness is isolated in $\epsilon$, allowing gradients to flow through $\mu$ and $\sigma$.

## VQ-VAE and Discrete Visual Tokens

VQ-VAE replaces a continuous latent with entries from a learned codebook $\{e_j\}_{j=1}^K$. For each encoder vector $z_e(x)$, it selects the nearest entry:

$$
k=\arg\min_j\|z_e(x)-e_j\|_2,
\qquad z_q(x)=e_k.
$$

The decoder reconstructs the image from $z_q$. Training typically combines:

- Reconstruction loss for the decoder.
- A codebook loss that moves $e_k$ toward the encoder output.
- A commitment loss that prevents the encoder output from moving arbitrarily between codes.

Because nearest-neighbor selection is not differentiable, a straight-through estimator copies the decoder gradient to the encoder.

Discrete latents are attractive for AR modeling because code indices form a finite vocabulary. They are compact, avoid some forms of posterior collapse, and make categorical cross-entropy available. The cost is **discretization loss**: a finite codebook cannot preserve every detail in a continuous representation.

## The Two Stages of DALL-E-Style Generation

A DALL-E-style pipeline separates visual compression from sequence modeling.

### Stage 1: Learn the Visual Tokenizer

A discrete VAE compresses an image into a lower-resolution grid of codebook indices. A good tokenizer must balance reconstruction fidelity and sequence length. A larger latent grid preserves detail but makes the Transformer sequence longer and generation slower.

### Stage 2: Learn the Token Prior

The tokenizer is fixed, and an autoregressive Transformer models a joint sequence of text and image tokens. At inference time, the text prefix conditions sequential image-token generation. The generated tokens are finally decoded to pixels.

When end-to-end training needs a differentiable approximation to categorical sampling, Gumbel-Softmax can replace hard argmax:

$$
y_i=\frac{\exp((\log\pi_i+g_i)/\tau)}
{\sum_j\exp((\log\pi_j+g_j)/\tau)},
$$

where $g_i$ is Gumbel noise and $\tau$ is temperature. High temperature produces a soft distribution; low temperature approaches a one-hot selection. Very low temperature improves discreteness but can make gradients unstable.

Generated candidates may also be reranked with a separate text-image alignment model. The AR likelihood measures sequence probability, while a reranker can prioritize semantic agreement with the prompt.

## Discrete Versus Continuous Image Tokens

Discrete tokens make image modeling look like language modeling, but language naturally starts with discrete symbols while images do not. Quantizing image features may discard fine texture and geometry.

Continuous-token approaches retain richer latent vectors and predict them directly. This removes codebook error but changes the output problem from categorical classification to continuous density or regression. The model must represent multimodality without a simple softmax vocabulary.

Token order also matters:

- **Raster-order causal modeling** supports standard GPT-style attention and efficient KV caching.
- **Random-order or bidirectional modeling** can use context from multiple directions, but inference and caching are less straightforward.

There is no universally best representation. Discrete tokens favor infrastructure reuse and stable categorical objectives; continuous tokens favor information preservation.

## Standard Speculative Decoding

Speculative decoding pairs a small draft model $q$ with a large target model $p$. The draft proposes several tokens sequentially, and the target verifies them in one parallel pass.

A proposed token $x$ is accepted with probability

$$
\min\left(1,\frac{p(x)}{q(x)}\right).
$$

After a rejection, a correction token is sampled from a distribution proportional to

$$
\max(0,p(x)-q(x)).
$$

This correction is what preserves the target distribution. Speculative decoding is not merely using a cheaper model and hoping its output is correct.

The speedup depends on the draft cost, the number of proposed tokens, and the acceptance rate. A draft that is cheap but poorly aligned with the target may save little.

## Why Image AR Is Difficult to Speculate

Language distributions often have a relatively dominant next token. Image-token distributions can be flatter: many nearby colors, textures, or codebook entries are similarly plausible. The draft and target may place probability mass on visually similar but different tokens.

Even when both distributions are flat, small differences across many categories can create high total variation distance:

$$
\mathrm{TV}(p,q)=\frac12\sum_x|p(x)-q(x)|.
$$

High total variation lowers acceptance. Exact token agreement is a harsh criterion when several tokens are semantically or visually interchangeable.

## Grouped Speculative Decoding

Grouped Speculative Decoding (GSD) clusters similar image tokens and compares probability mass at the group level. If $G$ is a token group, its probability is

$$
p(G)=\sum_{x\in G}p(x).
$$

Grouping smooths small disagreements within a visually coherent region of the vocabulary. A proposal can pass a group-level test even when draft and target prefer different members of the same group, after which token-level sampling preserves the correct distribution.

Static clustering is not always sufficient. Token similarity can depend on the current probability distribution and generation context. Dynamic, probability-aware clustering avoids wasting groups on tokens with negligible current mass and can adapt to the target's local uncertainty.

## Final Comparison

| Design choice | Benefit | Cost |
|---|---|---|
| VAE latent | Smooth probabilistic space | Can blur details |
| VQ-VAE token | Categorical AR modeling | Codebook information loss |
| Continuous token | Preserves richer features | Harder output distribution |
| Raster order | Causal KV caching | Fixed sequential dependency |
| Random order | Flexible context | More difficult inference |
| Standard speculation | Exact target distribution with lower latency | Low acceptance for flat image distributions |
| Grouped speculation | Treats similar image tokens coherently | Requires useful clustering |

The core challenge of AR image generation is the interface between representation and decoding. A compact tokenizer makes the sequence shorter but may lose visual detail; a rich tokenizer improves reconstruction but increases sequential work. Fast image generation therefore requires the tokenizer, prior, and decoder to be designed together.
