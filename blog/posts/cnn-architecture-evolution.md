---
title: CNN Architecture Evolution: From AlexNet to MobileNet
date: 2026-06-20
category: Machine Learning Acceleration
order: 1
tags: [CNN, computer vision, efficient deep learning]
description: A detailed study of how CNN design evolved from accuracy-driven architectures to residual learning and hardware-aware mobile networks.
---

## The Questions Behind CNN Design

The history of convolutional neural networks is often presented as a list of model names. A more useful way to study it is to follow the design problems that each generation tried to solve:

1. Can a large CNN be trained successfully on a large visual dataset?
2. How can a network become deeper without becoming impossible to optimize?
3. How can it capture visual patterns at multiple spatial scales?
4. How can accuracy be retained under strict memory, latency, and energy limits?

ImageNet and ILSVRC made these questions measurable. A model trained on ImageNet was also useful beyond classification because its learned features could be transferred to detection, segmentation, and other downstream tasks.

{{interactive:convolution}}

## AlexNet: The Large-Scale CNN Breakthrough

AlexNet demonstrated that a large CNN trained on GPUs could decisively outperform traditional vision systems. Its architecture contained five convolutional layers followed by three fully connected layers. The first layer used a large $11\times11$ kernel with stride 4, while later layers moved toward smaller $5\times5$ and $3\times3$ kernels.

Its importance came from the combination of architecture and training practice:

- ReLU avoided the severe saturation of sigmoid and tanh activations.
- GPU training made a large convolutional model practical.
- Data augmentation reduced overfitting.
- Dropout regularized the large fully connected layers.
- Momentum SGD and weight decay provided a stable optimization recipe.

AlexNet was effective, but its large kernels and fully connected layers made it parameter-heavy. Later architectures kept the central idea of learned convolutional hierarchies while replacing these expensive components.

## VGG: Small Kernels, Repeated Consistently

VGG simplified CNN design by using almost exclusively $3\times3$ convolutions with stride 1 and padding 1. Downsampling was handled separately by $2\times2$ max pooling.

Stacking small kernels has two advantages. Two $3\times3$ layers produce a $5\times5$ receptive field, and three produce a $7\times7$ receptive field. For $C$ input and output channels, two $3\times3$ layers use approximately $18C^2$ parameters, while one $5\times5$ layer uses $25C^2$. The stacked version also inserts an additional nonlinearity.

VGG showed that depth and regularity could be more valuable than complicated individual layers. Its uniform operators were also friendly to optimized convolution implementations. However, deeper plain networks remained difficult to train, and the large classifier still consumed many parameters.

## GoogLeNet: Multi-Scale Processing with Inception

An Inception module processes the same input through multiple branches, typically $1\times1$, $3\times3$, $5\times5$, and pooling. The outputs are concatenated along the channel dimension. This gives the network several receptive-field sizes within one stage.

The crucial efficiency device is the $1\times1$ convolution. Before an expensive spatial convolution, it reduces the number of channels. Suppose a $5\times5$ convolution maps $C_{in}$ channels to $C_{out}$ channels. Its parameter count is

$$
25C_{in}C_{out}.
$$

If a $1\times1$ layer first reduces the input to $C_b$ channels, the cost becomes

$$
C_{in}C_b + 25C_bC_{out},
$$

which is much smaller when $C_b\ll C_{in}$. The bottleneck also adds another learned nonlinearity. GoogLeNet therefore represents a shift from simply stacking layers to explicitly designing reusable, multi-branch modules.

## ResNet: Learning a Residual Instead of a Mapping

Making a plain network deeper can increase both test error and training error. This is the **degradation problem**: the larger model has enough capacity, but the optimizer fails to find even the solution represented by a shallower network.

ResNet changes a block from learning $H(x)$ directly to learning a residual $F(x)$:

$$
H(x)=F(x)+x.
$$

If the desired transformation is close to the identity, learning a small residual is easier than reconstructing the identity through many nonlinear layers. More importantly, the shortcut creates a direct path for information and gradients.

When dimensions differ, the shortcut may use a projection, but identity shortcuts are preferred when possible. Pre-activation ResNet later moved normalization and activation before the weight layers, leaving the shortcut path less obstructed. The deeper lesson is that trainability depends not only on which operations a network contains, but also on the paths through which signals propagate.

## Counting Convolution Cost

For output size $H_o\times W_o$, kernel size $K\times K$, and channel counts $C_{in}$ and $C_{out}$, a dense convolution requires roughly

$$
H_oW_oK^2C_{in}C_{out}
$$

multiply-accumulate operations. With $G$ groups, the cost is divided by approximately $G$ because each output channel connects to only $C_{in}/G$ input channels.

This calculation explains many efficient CNN operators, but FLOPs alone do not predict latency. Memory traffic, kernel launch overhead, vectorization, and the availability of optimized hardware kernels also matter.

## SqueezeNet and the Shift Toward Model Size

SqueezeNet targeted AlexNet-level accuracy with far fewer parameters. Its Fire module first uses a squeeze layer of $1\times1$ filters and then expands through a mixture of $1\times1$ and $3\times3$ filters. Delaying downsampling preserves activation resolution while the squeeze stage limits the expensive input-channel dimension.

The model also showed that architecture-level parameter reduction combines naturally with pruning, quantization, and lossless compression. These methods reduce different costs: architecture changes remove unnecessary structure, pruning removes connections, and quantization reduces bits per stored value.

## MobileNet: Separating Spatial and Channel Mixing

A standard convolution performs spatial filtering and channel mixing simultaneously. MobileNetV1 factorizes it into:

1. A **depthwise convolution**, applying one spatial filter per input channel.
2. A **pointwise convolution**, using $1\times1$ filters to mix channels.

The resulting operation count is

$$
H_oW_oK^2C_{in}+H_oW_oC_{in}C_{out},
$$

instead of $H_oW_oK^2C_{in}C_{out}$. The relative cost is approximately

$$
\frac{1}{C_{out}}+\frac{1}{K^2}.
$$

Width and resolution multipliers then expose a direct accuracy-efficiency trade-off.

MobileNetV2 introduced the **inverted residual** and **linear bottleneck**. A narrow input is expanded to a wider hidden representation, processed with a depthwise convolution, and projected back to a narrow output. The final projection is linear because applying ReLU in a low-dimensional bottleneck can destroy useful information.

MobileNetV3 combined hand-designed blocks with neural architecture search, squeeze-and-excitation channel attention, and the inexpensive h-swish activation. It illustrates the modern trend: architecture, search, and hardware measurements are optimized together.

## ShuffleNet and Group Communication

In depthwise-separable networks, the $1\times1$ pointwise convolution can dominate the cost. Grouped pointwise convolution reduces it, but repeated groups isolate information. Channel shuffle reshapes and permutes channels so that the next grouped layer receives inputs from different previous groups.

This is a general design lesson: reducing connectivity saves computation, but an explicit communication mechanism may be required to prevent representational isolation.

## U-Net and FPN: Reusing Multiple Resolutions

U-Net combines an encoder-decoder structure with skip connections between matching resolutions. Deep features provide context, while early high-resolution features restore localization. Feature Pyramid Networks use a related top-down and lateral-connection design for object detection, allowing predictions at several semantic scales.

These architectures show that downsampling is not free. It grows the receptive field but removes spatial detail, so dense prediction tasks need a path that recovers or preserves fine resolution.

## Final Perspective

The progression can be summarized as follows:

| Architecture | Main contribution | Main limitation addressed next |
|---|---|---|
| AlexNet | Large-scale GPU-trained CNN | Too many parameters and large kernels |
| VGG | Repeated small kernels and depth | Deep plain networks are hard to optimize |
| GoogLeNet | Multi-scale branches and bottlenecks | Complex manually designed modules |
| ResNet | Residual paths enable extreme depth | Deployment cost remains high |
| SqueezeNet | Parameter-efficient modules | FLOPs and latency still matter |
| MobileNet/ShuffleNet | Factorized, grouped mobile operators | Hardware-specific trade-offs |
| MobileNetV3 | NAS plus mobile-aware components | Joint model-system optimization |

CNN design evolved from maximizing benchmark accuracy toward balancing accuracy, optimization, memory, and real device latency. The best architecture is therefore not the one with the fewest FLOPs in isolation, but the one whose operators and dataflow fit its target hardware.
