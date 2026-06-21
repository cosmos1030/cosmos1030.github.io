---
title: Newton and Quasi-Newton Methods: Curvature as a Coordinate System
date: 2026-06-20
category: Optimization
order: 6
tags: [Newton method, BFGS, second-order optimization]
description: A detailed guide to Newton's method, damping, line search, quadratic convergence, BFGS, L-BFGS, and modern second-order approximations.
---

## From a Linear Model to a Quadratic Model

Gradient descent minimizes a local model containing a linear approximation plus an isotropic quadratic penalty:

$$
m_{GD}(p)=f(x)+\nabla f(x)^Tp+\frac{1}{2\eta}\|p\|^2.
$$

Its minimizer is $p=-\eta\nabla f(x)$. The same step scale is used in every direction.

Newton's method uses the actual local Hessian:

$$
m_N(p)=f(x)+g^Tp+\frac12p^THp,
$$

where $g=\nabla f(x)$ and $H=\nabla^2f(x)$. Setting the model gradient to zero gives

$$
Hp=-g,
\qquad p_N=-H^{-1}g.
$$

In practice, one solves the linear system rather than explicitly computing an inverse.

{{interactive:optimizer-newton}}

## Curvature Corrects the Gradient

The gradient measures slope but not the units or curvature of each coordinate. Newton's step scales an eigen-direction with curvature $\lambda_i$ by $1/\lambda_i$. Steep directions receive small steps and flat directions receive large steps.

This can be interpreted as gradient descent in a locally transformed coordinate system. If $H\succ0$, let $z=H^{1/2}x$. In $z$ coordinates, the local quadratic has spherical curvature, and an ordinary gradient step maps back to the Newton direction.

Newton's method is affine invariant in a way ordinary gradient descent is not: a linear reparameterization changes the Hessian and gradient together so that the physical step remains consistent.

## Exact Behavior on Quadratics

For

$$
f(x)=\frac12x^TAx-b^Tx,
\qquad A\succ0,
$$

the Hessian is exactly $A$ and the gradient is $Ax-b$. Newton's update gives

$$
x_{k+1}=x_k-A^{-1}(Ax_k-b)=A^{-1}b=x^*.
$$

One iteration solves the problem from any starting point. This is the idealized source of Newton's power.

## Why Pure Newton Can Fail

Far from a minimizer, the quadratic model may be inaccurate. Worse, in a nonconvex region the Hessian can be indefinite. Then

$$
g^Tp_N=-g^TH^{-1}g
$$

need not be negative, so the Newton direction may not even be a descent direction. A nearly singular Hessian can also produce an enormous unstable step.

Second-order information is useful only when it is controlled.

## Damping and Backtracking Line Search

A damped Newton update is

$$
x_{k+1}=x_k+t_kp_N,
\qquad 0<t_k\le1.
$$

Backtracking begins with $t=1$ and repeatedly multiplies it by $\beta\in(0,1)$ until the Armijo condition holds:

$$
f(x+tp)\le f(x)+\alpha t\nabla f(x)^Tp,
$$

with $\alpha\in(0,1/2)$. This requires the objective to decrease by a meaningful fraction of the local linear prediction.

Another stabilization replaces $H$ with $H+\lambda I$. Large $\lambda$ makes the step resemble gradient descent; small $\lambda$ recovers Newton. Trust-region methods instead constrain $\|p\|$ and ask how far the quadratic model should be trusted.

## Two Phases of Convergence

Globalized Newton methods typically show two regimes.

### Damped Phase

Far from the optimum, line search often chooses $t<1$. The goal is robust global progress rather than the fastest local rate.

### Pure Newton Phase

Near a solution where the Hessian is positive definite and Lipschitz continuous, the full step is accepted. The error satisfies

$$
\|x_{k+1}-x^*\|le C\|x_k-x^*\|^2.
$$

This is quadratic convergence. Once the error is small, the number of correct digits roughly doubles each iteration.

## Why Newton Is Not the Default for Deep Learning

For $d$ parameters, storing a dense Hessian costs $O(d^2)$ memory and solving a dense system costs $O(d^3)$ time. Even forming the Hessian is prohibitive for modern networks. Stochastic mini-batch curvature is also noisy, and a nonconvex Hessian is frequently indefinite.

Newton may still be attractive when the parameter dimension is moderate, high-accuracy solutions are required, or Hessian-vector products and structured solvers are available.

## Diagonal Newton and Preconditioning

A diagonal Hessian approximation uses

$$
p_i=-\frac{g_i}{H_{ii}+\epsilon}.
$$

It is cheap and resembles an adaptive optimizer, but it ignores cross-coordinate coupling. A rotated ill-conditioned problem cannot generally be fixed by diagonal scaling alone.

This explains both the value and limitation of Adam-like preconditioning: it adapts units per coordinate without learning a full curvature basis.

## The Secant Idea

Quasi-Newton methods build an approximation from gradient differences. Let

$$
s_k=x_{k+1}-x_k,
\qquad y_k=\nabla f(x_{k+1})-\nabla f(x_k).
$$

For a local quadratic, $y_k\approx Hs_k$. A Hessian approximation $B_{k+1}$ should therefore satisfy the secant equation

$$
B_{k+1}s_k=y_k.
$$

The update incorporates observed curvature while changing the previous approximation as little as possible.

## BFGS

BFGS updates the Hessian approximation as

$$
B_{k+1}=B_k
-\frac{B_ks_ks_k^TB_k}{s_k^TB_ks_k}
+\frac{y_ky_k^T}{y_k^Ts_k}.
$$

When $B_k\succ0$ and $y_k^Ts_k>0$, the new matrix remains positive definite. Combined with line search, this ensures a descent direction.

BFGS often achieves superlinear convergence without evaluating second derivatives. It learns curvature only along directions explored by the iterates, which is enough to become highly accurate near a smooth convex solution.

The full matrix still requires $O(d^2)$ memory.

## L-BFGS

Limited-memory BFGS stores only the most recent $m$ pairs $(s_k,y_k)$. A two-loop recursion applies the implicit inverse-Hessian approximation to the gradient using $O(md)$ memory and computation.

L-BFGS is effective for large deterministic or full-batch problems. Mini-batch noise corrupts gradient differences, making curvature estimates unstable unless batches are large or variance is controlled.

## Modern Structured Curvature

Large neural networks motivate approximations between diagonal scaling and a full Hessian:

- Hessian-vector products avoid explicitly storing $H$.
- Conjugate gradient approximately solves $Hp=-g$ using only products.
- Gauss-Newton and Fisher matrices provide positive-semidefinite curvature surrogates.
- Kronecker-factored methods approximate layerwise blocks.
- Low-rank methods retain dominant curvature directions.

These methods trade accuracy of the local geometry for manageable memory and distributed computation.

## Comparing the Methods

| Method | Curvature model | Memory | Typical behavior |
|---|---|---:|---|
| Gradient descent | Scalar $I/\eta$ | $O(d)$ | Linear convergence when strongly convex |
| Diagonal Newton | Hessian diagonal | $O(d)$ | Corrects coordinate scale only |
| Newton | Full exact Hessian | $O(d^2)$ | Local quadratic convergence |
| BFGS | Learned dense approximation | $O(d^2)$ | Local superlinear convergence |
| L-BFGS | Recent curvature pairs | $O(md)$ | Scalable deterministic optimization |

## Final Perspective

Second-order optimization is best viewed as geometry correction. Gradient descent assumes the same geometry everywhere, Newton uses the exact local geometry, and quasi-Newton methods learn enough geometry from successive gradients. Their practical value depends on whether improved iteration quality justifies the cost of acquiring, storing, and applying curvature information.
