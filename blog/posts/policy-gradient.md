---
title: Understanding Policy Gradient Methods
date: 2026-06-20
tags: [reinforcement learning, math]
description: An intuitive walkthrough of policy gradient algorithms, from the score function estimator to actor-critic methods.
---

## Introduction

The goal of reinforcement learning is to find a policy $\pi_\theta$ that maximizes the expected cumulative reward:

$$
J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t=0}^{T} \gamma^t r_t \right]
$$

where $\tau = (s_0, a_0, s_1, a_1, \ldots)$ is a trajectory sampled from the policy.

Unlike value-based methods, policy gradient methods directly optimize $\theta$ via gradient ascent. The key question is: how do we compute $\nabla_\theta J(\theta)$?

## The Score Function Trick

The environment dynamics $p(s_{t+1}|s_t, a_t)$ are unknown and non-differentiable with respect to $\theta$. We sidestep this using the **log-derivative trick**:

$$
\nabla_\theta \mathbb{E}_{x \sim p_\theta}[f(x)] = \mathbb{E}_{x \sim p_\theta}\left[ f(x) \nabla_\theta \log p_\theta(x) \right]
$$

Applying this to the trajectory distribution $p_\theta(\tau) = p(s_0)\prod_{t} \pi_\theta(a_t|s_t) p(s_{t+1}|s_t,a_t)$, we get:

$$
\nabla_\theta \log p_\theta(\tau) = \sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t | s_t)
$$

since the environment dynamics cancel out.

## Policy Gradient Theorem

Putting it together, the **policy gradient theorem** states:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t | s_t) \cdot G_t \right]
$$

where $G_t = \sum_{k=t}^{T} \gamma^{k-t} r_k$ is the return from time $t$.

In practice we estimate this with Monte Carlo samples:

$$
\hat{\nabla}_\theta J(\theta) = \frac{1}{N} \sum_{i=1}^{N} \sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t^{(i)} | s_t^{(i)}) \cdot G_t^{(i)}
$$

## Reducing Variance: Baselines

The gradient estimator above is unbiased but has high variance. We can subtract any **baseline** $b(s_t)$ that does not depend on the action without changing the expectation:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t} \nabla_\theta \log \pi_\theta(a_t | s_t) \cdot \left( G_t - b(s_t) \right) \right]
$$

The optimal baseline (in terms of variance reduction) is the **value function** $V^\pi(s_t) = \mathbb{E}[G_t | s_t]$, giving the **advantage**:

$$
A^\pi(s_t, a_t) = Q^\pi(s_t, a_t) - V^\pi(s_t)
$$

## Actor-Critic

When we parameterize the value function $V_\phi(s)$ alongside the policy $\pi_\theta$, we get an **actor-critic** algorithm:

- **Actor**: $\pi_\theta$ is updated using the policy gradient with $A_t$ as the signal.
- **Critic**: $V_\phi$ is updated to minimize the TD error $\delta_t = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t)$.

The update rules are:

$$
\theta \leftarrow \theta + \alpha \sum_t \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot \delta_t
$$

$$
\phi \leftarrow \phi - \beta \sum_t \delta_t \nabla_\phi V_\phi(s_t)
$$

## Summary

| Method | Estimator | Bias | Variance |
|--------|-----------|------|----------|
| REINFORCE | $G_t$ | None | High |
| REINFORCE + baseline | $G_t - b$ | None | Lower |
| Actor-Critic | $\delta_t$ | Low | Low |

Policy gradient methods trade off between bias and variance. Actor-critic sits in the sweet spot for most practical settings, and forms the backbone of modern algorithms like PPO and SAC.
