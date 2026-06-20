---
title: Linear Programming and the Simplex Method
date: 2026-06-20
category: Optimization
order: 1
tags: [linear programming, simplex, convex optimization]
description: A geometric and algebraic guide to linear programs, standard form, slack variables, basic feasible solutions, pivots, and simplex optimality.
---

## What a Linear Program Looks Like

A linear program (LP) optimizes a linear objective over linear equality and inequality constraints. A common maximization form is

$$
\max_x c^Tx
\quad\text{subject to}\quad
Ax\le b,\;x\ge0.
$$

Every constraint defines a half-space, and their intersection is a convex polyhedron. The objective has parallel level sets $c^Tx=\alpha$; solving the LP means moving the level set in direction $c$ until it reaches the last feasible point.

If an optimum exists and the feasible polyhedron has vertices, at least one optimum occurs at a vertex. This geometric fact is the foundation of the simplex method.

## Converting to Standard Form

Different LP conventions use different standard forms, but they can be converted systematically.

### Minimization to Maximization

$$
\min_x c^Tx
\quad\Longleftrightarrow\quad
\max_x -c^Tx.
$$

### Equality to Inequalities

$$
a^Tx=b
$$

is equivalent to the pair $a^Tx\le b$ and $-a^Tx\le-b$.

### Free Variables

An unrestricted variable can be written as

$$
x_j=x_j^+-x_j^-,
\qquad x_j^+,x_j^-\ge0.
$$

### Slack Variables

An inequality

$$
a_i^Tx\le b_i
$$

becomes

$$
a_i^Tx+s_i=b_i,
\qquad s_i\ge0.
$$

The slack measures unused capacity. It does not remove the original restriction because its nonnegativity still enforces $a_i^Tx\le b_i$.

## Basic Feasible Solutions

After introducing slacks, write the constraints as

$$
\tilde A\tilde x=b,
\qquad \tilde x\ge0.
$$

If there are $m$ independent equality constraints, choose $m$ columns forming an invertible basis matrix $B$. Split variables into basic and nonbasic components:

$$
B x_B+N x_N=b.
$$

Setting $x_N=0$ gives

$$
x_B=B^{-1}b.
$$

If $x_B\ge0$, this is a **basic feasible solution** (BFS). Under nondegeneracy, a BFS corresponds to a vertex of the feasible polyhedron. Algebraically changing the basis is geometrically moving between adjacent vertices.

## The Simplex Step

For the objective

$$
c_B^Tx_B+c_N^Tx_N,
$$

eliminate $x_B=B^{-1}(b-Nx_N)$:

$$
c_B^TB^{-1}b
+\left(c_N^T-c_B^TB^{-1}N\right)x_N.
$$

The coefficients

$$
\bar c_N^T=c_N^T-c_B^TB^{-1}N
$$

are reduced costs. In a maximization problem, a nonbasic variable with positive reduced cost can improve the objective and is a candidate to enter the basis.

Suppose column $a_j$ enters. Increasing $x_j$ changes basic variables as

$$
x_B=B^{-1}b-B^{-1}a_jx_j.
$$

Feasibility requires every component to remain nonnegative. The ratio test determines the largest step:

$$
t^*=\min_{i:(B^{-1}a_j)_i>0}
\frac{(B^{-1}b)_i}{(B^{-1}a_j)_i}.
$$

The limiting basic variable leaves the basis. Replacing its column with $a_j$ is a pivot.

## Why a Pivot Improves the Objective

The entering variable is selected because its reduced cost indicates an improving direction. The ratio test moves as far as possible along that edge without leaving the feasible region. At the endpoint, at least one basic variable reaches zero, producing an adjacent BFS.

The simplex method therefore alternates two decisions:

1. Choose an edge that improves the objective.
2. Move to the farthest feasible point along that edge.

Gaussian elimination or tableau operations update the algebraic representation of the new basis.

## Detecting Optimality

For the chosen maximization convention, if every nonbasic reduced cost is nonpositive, no adjacent feasible edge improves the objective. Convexity of the feasible polyhedron and linearity of the objective imply that the current BFS is globally optimal.

These reduced-cost conditions are closely related to dual feasibility. At optimality, primal feasibility, dual feasibility, and complementary slackness hold together.

## Unboundedness and Infeasibility

If an entering variable has an improving reduced cost but

$$
B^{-1}a_j\le0,
$$

then increasing it never violates nonnegativity of the basic variables. The objective can improve without bound, so the LP is unbounded.

Finding an initial BFS is a separate problem. Slack variables provide one immediately only when the right-hand side is nonnegative and the slack basis is feasible. Otherwise a Phase I problem introduces artificial variables and minimizes their total violation. A positive Phase I optimum certifies that the original LP is infeasible.

## Degeneracy and Cycling

A BFS is degenerate when one or more basic variables equal zero. The ratio test may then permit a zero-length pivot, changing the basis without changing the point or objective. In rare cases, a sequence of such pivots can cycle.

Pivot rules such as Bland's rule prevent cycling by selecting entering and leaving variables according to a fixed index order. Anti-cycling safety may sacrifice the aggressive improvement of other heuristics.

## Simplex Versus Interior-Point Methods

Simplex travels along vertices and edges. Interior-point methods move through the interior while following a central path. Simplex has exponential worst-case examples but is extremely effective on many practical LPs and produces useful basis information. Interior-point methods have polynomial complexity and are attractive for large sparse problems.

The preferred method depends on sparsity, warm starts, required accuracy, and whether a reusable optimal basis is valuable.

## Connection to QP and Conic Optimization

LP is the $Q=0$ special case of quadratic programming. It is also a special case of SOCP and SDP. Moving to these richer problem classes changes the feasible geometry:

- LP uses polyhedral scalar inequalities.
- SOCP introduces norm cones with curved boundaries.
- SDP introduces the positive-semidefinite matrix cone.

Simplex relies specifically on polyhedral vertices and does not extend directly to these nonpolyhedral cones.

## Final Perspective

The simplex method combines geometry and linear algebra. A basis represents a vertex, reduced costs identify improving edges, and the ratio test preserves feasibility. Its importance is not just historical: it introduces the primal-dual viewpoint, active constraints, and basis changes that reappear throughout constrained optimization.
