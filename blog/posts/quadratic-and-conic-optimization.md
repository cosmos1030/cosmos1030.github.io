---
title: Quadratic and Conic Optimization: QP, Least Squares, and SOCP
date: 2026-06-20
category: Optimization
order: 2
tags: [quadratic programming, SOCP, convex optimization]
description: A detailed guide to convex quadratic programs, equality-constrained least squares, KKT systems, second-order cones, and robust reformulations.
---

## From Linear to Quadratic Programs

A quadratic program (QP) has a quadratic objective and linear constraints. One common form is

$$
\min_x\; w^Tx+x^TQx
\quad\text{subject to}\quad
Ax\le b,\;Cx=e.
$$

The Hessian of the objective is $2Q$. If the symmetric part of $Q$ is positive semidefinite, then the objective is convex. With affine constraints, the entire problem is convex and every local optimum is global.

Linear programming is the special case $Q=0$. Least squares is also a QP because

$$
\|Ax-b\|^2
=x^TA^TAx-2b^TAx+b^Tb,
$$

and $A^TA\succeq0$. These inclusion relationships matter because one solver framework can handle many apparently different problems.

## Equality-Constrained Least Squares

Consider

$$
\min_{x\in\mathbb R^d}\|Ax-b\|^2
\quad\text{subject to}\quad Cx=e,
$$

where $C\in\mathbb R^{p\times d}$. Introduce a multiplier $z\in\mathbb R^p$ and form

$$
L(x,z)=\|Ax-b\|^2+z^T(Cx-e).
$$

First-order stationarity and feasibility give

$$
2A^T(Ax-b)+C^Tz=0,
\qquad Cx=e.
$$

Together they form the KKT system

$$
\begin{bmatrix}
2A^TA&C^T\\
C&0
\end{bmatrix}
\begin{bmatrix}x\\z\end{bmatrix}
=
\begin{bmatrix}2A^Tb\\e\end{bmatrix}.
$$

The zero block reflects the fact that the Lagrangian is linear in the multiplier. The matrix is indefinite even though the original objective is convex, so it needs an appropriate linear solver.

## When Is the Solution Unique?

Useful rank assumptions are

$$
\operatorname{rank}(C)=p,
\qquad
\operatorname{rank}\begin{bmatrix}A\\C\end{bmatrix}=d.
$$

The first says that equality constraints are independent. The second says there is no nonzero direction invisible to both the objective and the constraints.

To see why the KKT matrix is invertible, suppose a null vector $(\bar x,\bar z)$ exists. Then

$$
2A^TA\bar x+C^T\bar z=0,
\qquad C\bar x=0.
$$

Multiplying the first equation by $\bar x^T$ yields $\|A\bar x\|^2=0$, so $A\bar x=0$. The stacked full-column-rank condition gives $\bar x=0$, and full row rank of $C$ then gives $\bar z=0$. The nullspace is trivial.

The same KKT equations prove optimality. For any feasible $x$, expand the objective around $x^*$; the cross term vanishes because stationarity expresses it through $C^Tz$ and both points satisfy the same equality constraint.

## The Second-Order Cone

The second-order, or Lorentz, cone is

$$
\mathcal Q^{n+1}={(u,t):\|u\|_2\le t\}.
$$

It is a convex cone: nonnegative scaling preserves membership, and the triangle inequality proves convexity.

A second-order cone program (SOCP) has a linear objective, affine equalities, and constraints of the form

$$
\|A_ix-b_i\|_2\le c_i^Tx+e_i.
$$

The right-hand side must be nonnegative at every feasible point. This is an affine expression constrained to dominate a norm.

SOCP contains LP as a special case because a scalar linear inequality can be represented with a trivial zero-dimensional norm. At the same time, it models much richer geometry, including norm bounds, robust constraints, and quadratic epigraphs.

## Why SOCP Is Convex

Define

$$
f_i(x)=\|A_ix-b_i\|_2-c_i^Tx-e_i.
$$

The norm of an affine mapping is convex, and subtracting an affine function preserves convexity. Therefore the sublevel set $\{x:f_i(x)\le0\}$ is convex. Intersections of these sets with affine equalities remain convex.

This proof pattern is broadly useful: identify each constraint as a convex function bounded above by zero.

## Turning a Convex Quadratic into a Cone Constraint

For $Q\succeq0$, write

$$
x^TQx=\|Q^{1/2}x\|^2.
$$

Introduce $y=Q^{1/2}x$ and an epigraph variable $t$ with $\|y\|^2\le t$. The objective becomes linear, $w^Tx+t$.

The quadratic epigraph can be written as a standard SOC constraint:

$$
\left\|\begin{bmatrix}2y\\t-1\end{bmatrix}\right\|_2
\le t+1.
$$

Squaring both sides reduces the inequality to $4\|y\|^2\le4t$. Thus a convex QP can be reformulated as an SOCP. Solver implementations may use a rotated second-order cone for an even more direct representation.

## Robust Linear Constraints

Suppose the coefficient in a linear constraint is uncertain:

$$
a\sim\mathcal N(\bar a,K),
\qquad
\Pr(a^Tx\le b)\ge1-\epsilon.
$$

Since $a^Tx$ is Gaussian with mean $\bar a^Tx$ and variance $x^TKx$, the chance constraint becomes

$$
\bar a^Tx+Phi^{-1}(1-\epsilon)\sqrt{x^TKx}\le b.
$$

Using $\sqrt{x^TKx}=\|K^{1/2}x\|$, this is

$$
\Phi^{-1}(1-\epsilon)\|K^{1/2}x\|
\le b-\bar a^Tx,
$$

an SOC constraint when $\epsilon<1/2$. A probabilistic reliability requirement has become a deterministic convex program.

The Gaussian assumption is doing real work. Different uncertainty sets or distributions lead to different robust counterparts and may not remain SOCP-representable.

## QP, SOCP, and Solver Choice

| Problem | Characteristic structure | Useful approach |
|---|---|---|
| Unconstrained least squares | $A^TAx=A^Tb$ | QR, SVD, or normal equations |
| Equality-constrained LS | Saddle-point KKT system | Structured factorization |
| Convex QP | PSD quadratic plus affine constraints | Active-set or interior-point methods |
| SOCP | Norm bounded by affine expressions | Conic interior-point or first-order splitting |
| Robust Gaussian LP | Chance constraints | SOCP reformulation |

## Final Perspective

The main skill in convex optimization is often representation rather than inventing a new algorithm. Least squares becomes a QP, a quadratic epigraph becomes a cone, and a Gaussian chance constraint becomes a deterministic norm inequality. Once the structure is exposed, mature solvers can exploit it with global optimality guarantees.
