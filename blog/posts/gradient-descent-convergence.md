---
title: Gradient Descent: Smoothness, Convexity, and Convergence
date: 2026-06-20
category: Optimization
order: 4
tags: [gradient descent, convex optimization, convergence]
description: A rigorous guide to gradient descent, smoothness, convexity, strong convexity, convergence rates, and the geometry of conditioning.
---

## Why Gradient Descent Works

For a differentiable objective $f:\mathbb R^d\to\mathbb R$, gradient descent performs

$$
x_{k+1}=x_k-\eta\nabla f(x_k).
$$

The gradient points in the direction of greatest local increase, so its negative is the steepest descent direction under the Euclidean norm. A first-order Taylor approximation makes this explicit:

$$
f(x_k+s)\approx f(x_k)+\nabla f(x_k)^Ts.
$$

Among steps with fixed Euclidean length, choosing $s$ opposite to the gradient minimizes the linearized objective. This argument is local, however. A large step can leave the region where the approximation is accurate, so the learning rate is part of the algorithm's mathematical guarantee.

## Smoothness Controls the Step Size

A function is $L$-smooth when its gradient is Lipschitz continuous:

$$
\|\nabla f(x)-\nabla f(y)\|\le L\|x-y\|.
$$

Equivalently, the function is upper-bounded by a quadratic model:

$$
f(y)\le f(x)+\nabla f(x)^T(y-x)+\frac{L}{2}\|y-x\|^2.
$$

Substituting $y=x-\eta\nabla f(x)$ gives the descent lemma:

$$
f(x_{k+1})le f(x_k)-\eta
\left(1-\frac{L\eta}{2}\right)\|\nabla f(x_k)\|^2.
$$

Thus any $0<\eta<2/L$ guarantees descent, and $\eta=1/L$ gives the clean bound

$$
f(x_{k+1})\le f(x_k)-\frac{1}{2L}\|\nabla f(x_k)\|^2.
$$

Smoothness does not say the problem is easy or convex. It only limits how rapidly the gradient can change.

{{interactive:optimizer-gd}}

## What Can Be Guaranteed Without Convexity?

Suppose $f$ is smooth and bounded below by $f_{inf}$. Summing the descent inequality over $T$ steps yields

$$
\frac{1}{T}\sum_{k=0}^{T-1}\|\nabla f(x_k)\|^2
\le \frac{2L(f(x_0)-f_{inf})}{T}.
$$

Therefore

$$
\min_{0\le k<T}\|\nabla f(x_k)\|^2=O(1/T).
$$

Gradient descent eventually reaches an approximately stationary point. In a nonconvex problem, stationary may mean a local minimum, a saddle point, or even a local maximum. First-order stationarity is the natural generic guarantee, not global optimality.

## Convexity Turns Local Information into Global Information

A differentiable function is convex when

$$
f(y)\ge f(x)+\nabla f(x)^T(y-x)
$$

for every $x,y$. The tangent plane is a global lower bound. Consequently, if $\nabla f(x)=0$, then $x$ is globally optimal.

Convexity also connects the gradient direction to the distance from an optimum $x^*$:

$$
f(x)-f(x^*)\le \nabla f(x)^T(x-x^*).
$$

Combining this inequality with the squared-distance recursion gives, for a suitable fixed step size,

$$
f(\bar{x}_T)-f(x^*)=O\left(\frac{L\|x_0-x^*\|^2}{T}\right),
$$

where $\bar{x}_T$ may be an average iterate. Smooth convex gradient descent therefore has a sublinear $O(1/T)$ objective convergence rate.

## Strong Convexity Gives Geometric Convergence

A function is $\mu$-strongly convex when

$$
f(y)\ge f(x)+\nabla f(x)^T(y-x)
+\frac{\mu}{2}\|y-x\|^2.
$$

The additional quadratic term prevents flat directions, implies a unique minimizer, and connects objective error to distance:

$$
f(x)-f(x^*)\ge\frac{\mu}{2}\|x-x^*\|^2.
$$

For an $L$-smooth, $\mu$-strongly convex function and step size $1/L$,

$$
f(x_k)-f(x^*)
\le\left(1-\frac{\mu}{L}\right)^k
[f(x_0)-f(x^*)].
$$

This is linear, or geometric, convergence: each iteration removes a constant fraction of the remaining error. Reaching error $\epsilon$ requires

$$
O\left(\frac{L}{\mu}\log\frac{1}{\epsilon}\right)
$$

iterations.

## The Condition Number

The ratio

$$
\kappa=\frac{L}{\mu}
$$

is the condition number. A large $\kappa$ means that curvature differs greatly across directions. The learning rate must remain small enough for the steep direction, so progress along a flat direction is slow.

For a quadratic

$$
f(x)=\frac12x^TAx-b^Tx,
$$

with $A\succ0$, the smoothness and strong-convexity constants are the largest and smallest eigenvalues of $A$. The level sets are ellipses. Gradient descent tends to zigzag across the narrow direction while slowly moving along the long axis.

Conditioning is therefore a geometric problem. Momentum, adaptive scaling, preconditioning, and Newton's method can all be interpreted as attempts to change this geometry.

## Coercivity and Existence of a Minimizer

Convergence analysis often refers to an optimum $x^*$, but an infimum need not be attained. A continuous function is coercive if

$$
\|x\|\to\infty\quad\Longrightarrow\quad f(x)\to\infty.
$$

Coercivity prevents minimizing sequences from escaping to infinity. Combined with continuity, it guarantees that a minimizer exists. Strong convexity implies coercive behavior for the usual unconstrained setting.

## Learning-Rate Decay

A constant learning rate is effective while far from the solution, but stochastic gradients contain persistent noise. Near an optimum, this noise can keep iterates in a neighborhood rather than allowing exact convergence. Decaying the learning rate reduces the noise floor.

The schedule balances two goals:

- Large early steps produce fast progress and cross shallow regions.
- Small late steps refine the solution and reduce oscillation.

In deterministic smooth optimization, a correct constant step can already converge. Decay is not a replacement for selecting a stable initial scale.

## Optimization Is Not Generalization

A lower training objective does not guarantee lower validation error. Optimization asks how effectively the algorithm minimizes the chosen empirical objective. Generalization asks whether that objective and its solution perform well on unseen data.

Batch size, noise, regularization, and learning-rate schedules can change which minimum is found even when training losses are similar. It is therefore important to report optimization metrics and generalization metrics separately.

## Summary of Rates

| Assumptions | Typical guarantee for gradient descent |
|---|---|
| $L$-smooth, nonconvex | $\min_k\|\nabla f(x_k)\|^2=O(1/T)$ |
| $L$-smooth, convex | $f(x_T)-f^*=O(1/T)$ |
| $L$-smooth, $\mu$-strongly convex | $f(x_T)-f^*=O((1-1/\kappa)^T)$ |

## Final Perspective

The gradient update is simple, but its behavior is governed by three different properties. Smoothness determines a stable step size, convexity determines whether local information identifies a global solution, and strong convexity determines whether progress accelerates from sublinear to geometric. The condition number then measures how much the geometry slows that progress.
