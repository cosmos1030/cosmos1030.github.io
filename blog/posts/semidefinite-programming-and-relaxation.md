---
title: Semidefinite Programming: Matrix Inequalities and Convex Relaxation
date: 2026-06-20
category: Optimization
tags: [semidefinite programming, convex relaxation, MAXCUT]
description: A detailed introduction to PSD matrices, linear matrix inequalities, SDP, Schur complements, and the MAXCUT semidefinite relaxation.
---

## Positive Semidefinite Matrices

A symmetric matrix $X$ is positive semidefinite (PSD), written $X\succeq0$, when

$$
v^TXv\ge0
$$

for every vector $v$. Equivalently, all eigenvalues of $X$ are nonnegative. A PSD matrix need not be invertible; positive definite, $X\succ0$, requires strictly positive eigenvalues.

The PSD cone is convex. If $X,Y\succeq0$ and $\theta\in[0,1]$, then

$$
v^T(\theta X+(1-\theta)Y)v
=\theta v^TXv+(1-\theta)v^TYv\ge0.
$$

This cone is the feasible geometry underlying semidefinite programming.

## Linear Matrix Inequalities

A linear matrix inequality (LMI) has the form

$$
F(x)=F_0+\sum_{i=1}^{d}x_iF_i\succeq0,
$$

where all $F_i$ are symmetric. The mapping from $x$ to $F(x)$ is affine, and the inverse image of the convex PSD cone under an affine map is convex.

An SDP typically minimizes a linear objective subject to affine equalities and one or more LMIs:

$$
\min_x c^Tx
\quad\text{subject to}\quad
F(x)\succeq0,\;Ax=b.
$$

An equivalent matrix-variable form minimizes $\langle C,X\rangle=\operatorname{Tr}(C^TX)$ subject to linear measurements of $X$ and $X\succeq0$.

## LP and SOCP Inside SDP

If every matrix in an LMI is diagonal, PSD simply means each diagonal entry is nonnegative. The matrix inequality becomes a collection of scalar linear inequalities, so LP is a special case of SDP.

An SOC constraint

$$
\|u\|_2\le t
$$

can be represented by the LMI

$$
\begin{bmatrix}
tI&u\\
u^T&t
\end{bmatrix}\succeq0.
$$

Thus SOCP is also a special case of SDP. This inclusion does not imply that every SDP should be solved with a generic SDP solver. LP and SOCP structure usually permits much cheaper algorithms.

## The Schur Complement

For a symmetric block matrix

$$
M=\begin{bmatrix}A&B\\B^T&C\end{bmatrix},
$$

with $A\succ0$, the Schur complement identity states

$$
M\succeq0
\quad\Longleftrightarrow\quad
C-B^TA^{-1}B\succeq0.
$$

It converts a matrix PSD condition into a quadratic inequality and vice versa. Applying it to the SOC LMI above with $A=tI$ gives

$$
t-\frac{1}{t}u^Tu\ge0,
$$

which is equivalent to $\|u\|^2\le t^2$ for $t>0$.

Schur complements are a standard language for expressing bounds on norms, quadratic forms, covariance, and control-system stability as LMIs.

## Lifting a Quadratic Problem

For a vector $x$, introduce the matrix

$$
X=xx^T.
$$

Then every quadratic product becomes linear in $X$:

$$
x^TQx=\operatorname{Tr}(QX)=\langle Q,X\rangle.
$$

The exact relationship $X=xx^T$ is characterized by

$$
X\succeq0,
\qquad \operatorname{rank}(X)=1.
$$

Lifting increases dimension but turns a quadratic objective or constraint into a linear expression. The nonconvexity is concentrated in the rank-one condition.

## MAXCUT as a Quadratic Problem

For a weighted graph, assign each vertex $i$ a label $x_i\in\{-1,+1\}$. Vertices are on opposite sides of the cut when $x_ix_j=-1$. Edge $(i,j)$ contributes

$$
\frac{w_{ij}}{2}(1-x_ix_j).
$$

MAXCUT is therefore a quadratic maximization subject to

$$
x_i^2=1.
$$

The equality constraints are nonconvex even though the squared expression looks simple: a level set of a convex quadratic is generally not a convex set.

## SDP Relaxation of MAXCUT

Lift $X=xx^T$. Then $X_{ij}=x_ix_j$, and $x_i^2=1$ becomes

$$
X_{ii}=1.
$$

The exact lifted formulation contains

$$
X\succeq0,
\qquad X_{ii}=1,
\qquad \operatorname{rank}(X)=1.
$$

Dropping the nonconvex rank constraint gives an SDP relaxation. The feasible set becomes larger, so for a maximization problem its optimal value is an upper bound on the true MAXCUT value.

A relaxation makes a problem tractable by allowing solutions that may not correspond to any original discrete vector. It does not automatically produce a valid cut.

## Recovering a Discrete Solution

If the SDP solution $X^*$ happens to have rank one, it directly yields an exact vector up to sign. Usually it has higher rank. Factor it as

$$
X^*=VV^T,
$$

so each graph vertex corresponds to a vector $v_i$ on a unit sphere.

A simple approximation takes a leading rank-one component. A stronger randomized rounding method samples a random hyperplane and assigns signs according to which side each $v_i$ lies on. Repeating rounding and keeping the best cut converts the continuous geometric solution into a feasible discrete solution.

Relaxation quality has two components:

- The gap between the SDP upper bound and the true optimum.
- The quality loss introduced by rounding.

## Why SDP Is Powerful and Expensive

SDPs model correlations among many variables through a matrix. This makes them useful in combinatorial optimization, control, covariance estimation, and robustness. But an $n\times n$ matrix variable has $O(n^2)$ entries, and classical interior-point methods become expensive quickly.

Large problems often use first-order methods, exploit sparsity, decompose chordal structure, or factorize $X=YY^T$ with a chosen low rank. The factorized form saves memory but reintroduces nonconvexity.

## Final Hierarchy

| Class | Canonical constraint | Relative expressiveness |
|---|---|---|
| LP | $a^Tx\le b$ | Scalar affine inequalities |
| SOCP | $\|Ax-b\|\le c^Tx+d$ | Norm and robust constraints |
| SDP | $F_0+\sum_i x_iF_i\succeq0$ | Matrix-valued inequalities |

The inclusions are

$$
\mathrm{LP}\subseteq\mathrm{SOCP}\subseteq\mathrm{SDP}.
$$

Greater expressiveness usually means greater computational cost.

## Final Perspective

Semidefinite programming turns matrix positivity into a convex constraint. Its most important conceptual tool is lifting: move from vectors to pairwise products, isolate nonconvexity in a rank condition, and then relax that condition. The resulting SDP provides both a computable bound and geometric information from which an approximate discrete solution can be recovered.
