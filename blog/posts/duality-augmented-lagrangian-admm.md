---
title: Duality, Augmented Lagrangians, and ADMM
date: 2026-06-20
category: Optimization
order: 7
tags: [duality, ADMM, constrained optimization]
description: A detailed guide to Lagrangian duality, dual gradient ascent, augmented Lagrangians, the method of multipliers, and ADMM splitting.
---

## Constraints as Prices

Consider

$$
\min_x f(x)
\quad\text{subject to}\quad
h(x)=0,
$$

with Lagrangian

$$
L(x,\lambda)=f(x)+\lambda^Th(x).
$$

The multiplier $\lambda$ assigns a price to constraint violation. For a fixed price, minimizing $L$ over $x$ gives the dual function

$$
g(\lambda)=\inf_x L(x,\lambda).
$$

Because $g$ is a pointwise infimum of affine functions of $\lambda$, it is concave even when the primal problem is not convex. The dual problem maximizes this lower bound:

$$
\max_\lambda g(\lambda).
$$

## Weak and Strong Duality

For every feasible $x$ and any $\lambda$,

$$
g(\lambda)\le L(x,\lambda)=f(x).
$$

Therefore the dual optimum never exceeds the primal optimum in minimization. This is weak duality.

Strong duality means the optimal values are equal. Convexity alone is not always sufficient; a constraint qualification such as Slater's condition is typically required. When strong duality and suitable regularity hold, KKT conditions characterize primal-dual optimality.

Duality provides lower bounds even without equality, so the duality gap can certify how far a feasible solution is from optimal.

## Why Optimize the Dual?

Projection onto a complicated primal feasible set may be expensive. The dual can replace projection with unconstrained or simply constrained multiplier updates. It can also decompose when

$$
f(x)=\sum_i f_i(x_i)
$$

and the variables interact only through a shared constraint.

If $x(\lambda)$ uniquely minimizes $L(x,\lambda)$, Danskin's theorem gives

$$
\nabla g(\lambda)=h(x(\lambda)).
$$

The dual gradient is the primal residual. Dual ascent therefore performs

$$
\lambda_{k+1}=\lambda_k+\eta h(x_{k+1}).
$$

If a constraint is violated positively, its price increases.

## Equality-Constrained Quadratic Example

For

$$
\min_x\frac12x^TQx+c^Tx
\quad\text{subject to}\quad Ax=b,
$$

with $Q\succ0$, minimizing the Lagrangian over $x$ gives

$$
x(\lambda)=-Q^{-1}(c+A^T\lambda).
$$

Substitution produces a concave quadratic dual. The dual gradient $Ax(\lambda)-b$ is exactly the equality residual. This example makes the interpretation of multipliers and residual-driven updates explicit.

## When the Dual Is Nonsmooth

If the Lagrangian minimizer is not unique, the dual may not be differentiable. A minimizing primal point still provides a subgradient, but subgradient ascent has slower convergence and is sensitive to step schedules.

The issue is that a linear multiplier term may not give enough curvature to make the primal minimization stable or unique. The augmented Lagrangian addresses this directly.

## Augmented Lagrangian

For $Ax=b$, define

$$
L_\rho(x,\lambda)=
f(x)+\lambda^T(Ax-b)+\frac{\rho}{2}\|Ax-b\|^2.
$$

The quadratic penalty discourages infeasibility and improves curvature, but unlike a pure penalty method, the multiplier preserves exact constraint enforcement without requiring $\rho\to\infty$.

Completing the square gives

$$
L_\rho(x,\lambda)=f(x)
+\frac{\rho}{2}\left\|Ax-b+\frac{\lambda}{\rho}\right\|^2
-\frac{1}{2\rho}\|\lambda\|^2.
$$

This form leads naturally to a scaled dual variable $u=\lambda/\rho$.

## Method of Multipliers

The method alternates

$$
x^{k+1}=\arg\min_x L_\rho(x,\lambda^k),
$$

$$
\lambda^{k+1}=\lambda^k+ho(Ax^{k+1}-b).
$$

Compared with ordinary dual ascent, the primal subproblem includes a stabilizing quadratic residual. The method has strong convergence behavior for convex problems, but the joint minimization over all primal variables may still be difficult.

## Variable Splitting and ADMM

Alternating Direction Method of Multipliers targets separable objectives:

$$
\min_{x,z} f(x)+g(z)
\quad\text{subject to}\quad Ax+Bz=c.
$$

Using the scaled dual $u$, ADMM performs

$$
x^{k+1}=\arg\min_x
f(x)+\frac{\rho}{2}\|Ax+Bz^k-c+u^k\|^2,
$$

$$
z^{k+1}=\arg\min_z
g(z)+\frac{\rho}{2}\|Ax^{k+1}+Bz-c+u^k\|^2,
$$

$$
u^{k+1}=u^k+Ax^{k+1}+Bz^{k+1}-c.
$$

The key difference from the method of multipliers is alternating rather than joint minimization. Each subproblem can preserve special structure such as a least-squares solve or proximal operator.

## Lasso via ADMM

For

$$
\min_x\frac12\|Ax-b\|^2+\lambda\|x\|_1,
$$

introduce $z$ and require $x=z$. The $x$ update is quadratic:

$$
x^{k+1}=(A^TA+\rho I)^{-1}
[A^Tb+\rho(z^k-u^k)].
$$

The $z$ update is soft thresholding:

$$
z^{k+1}=S_{\lambda/\rho}(x^{k+1}+u^k),
$$

where

$$
S_\kappa(a)=\operatorname{sign}(a)\max(|a|-\kappa,0).
$$

Splitting separates smooth data fitting from nonsmooth sparsity.

## Consensus Optimization

Suppose workers have local objectives $f_i(x)$. Introduce local copies $x_i$ and a global variable $z$:

$$
\min_{x_i,z}\sum_i f_i(x_i)
\quad\text{subject to}\quad x_i=z.
$$

Each worker updates $x_i$ independently, the system averages information to update $z$, and dual variables track disagreement. ADMM converts one coupled problem into parallel local computation plus communication.

## Residuals and the Penalty Parameter

The primal residual measures feasibility:

$$
r^{k+1}=Ax^{k+1}+Bz^{k+1}-c.
$$

The dual residual measures movement associated with the split variable, commonly

$$
s^{k+1}=\rho A^TB(z^{k+1}-z^k)
$$

up to the selected convention.

Large $\rho$ emphasizes primal agreement but can slow dual progress; small $\rho$ allows more disagreement. Residual balancing adjusts $\rho$ when one residual dominates, while scaling the dual variable consistently.

## Comparing the Algorithms

| Method | Primal step | Strength | Limitation |
|---|---|---|---|
| Dual gradient ascent | Minimize ordinary Lagrangian | Simple decomposition | Dual may be nonsmooth |
| Method of multipliers | Joint augmented minimization | Better stability and convergence | Coupled primal solve |
| ADMM | Alternating augmented minimization | Exploits separable structure | Can converge slowly to high accuracy |

## Final Perspective

Dual methods turn constraint violation into an optimization signal. The augmented Lagrangian adds curvature without abandoning multiplier information, and ADMM uses variable splitting so each part of a problem can be solved by the method best suited to it. Its value lies less in raw asymptotic speed than in exposing parallelism, proximal structure, and modular subproblems.
