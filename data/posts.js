const sitePosts = [
    {
        "slug": "cnn-architecture-evolution",
        "title": "CNN Architecture Evolution: From AlexNet to MobileNet",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 1,
        "description": "A detailed study of how CNN design evolved from accuracy-driven architectures to residual learning and hardware-aware mobile networks.",
        "tags": [
            "CNN",
            "computer vision",
            "efficient deep learning"
        ]
    },
    {
        "slug": "neural-architecture-search",
        "title": "Neural Architecture Search: From RL Controllers to Once-for-All Networks",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 2,
        "description": "A detailed guide to architecture search spaces, RL-based NAS, weight sharing, DARTS, Once-for-All networks, and predictor-based evaluation.",
        "tags": [
            "NAS",
            "AutoML",
            "model optimization"
        ]
    },
    {
        "slug": "parameter-efficient-fine-tuning",
        "title": "Parameter-Efficient Fine-Tuning: LoRA, ReFT, and Efficient Backpropagation",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 3,
        "description": "An in-depth guide to low-rank adaptation, representation fine-tuning, multi-concept customization, and low-precision training optimization.",
        "tags": [
            "PEFT",
            "LoRA",
            "fine-tuning"
        ]
    },
    {
        "slug": "autoregressive-image-models",
        "title": "Autoregressive Image Models: From VAE and VQ-VAE to Fast Decoding",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 4,
        "description": "A detailed study of latent image tokenization, DALL-E-style generation, continuous tokens, and grouped speculative decoding.",
        "tags": [
            "autoregressive models",
            "VQ-VAE",
            "image generation"
        ]
    },
    {
        "slug": "diffusion-models-and-acceleration",
        "title": "Diffusion Models: Denoising, Score Matching, and Fast Sampling",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 5,
        "description": "A detailed guide to DDPMs, score-based diffusion, guidance, numerical solvers, quantization, distillation, and temporal feature reuse.",
        "tags": [
            "diffusion",
            "generative models",
            "model acceleration"
        ]
    },
    {
        "slug": "neural-network-quantization",
        "title": "Neural Network Quantization: From Binary Networks to LLM Weight-Only Methods",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 6,
        "description": "An in-depth guide to quantization error, QAT and PTQ, mixed precision, activation outliers, GPTQ, SmoothQuant, AWQ, and weight-only inference.",
        "tags": [
            "quantization",
            "model compression",
            "LLM"
        ]
    },
    {
        "slug": "gpu-cuda-execution-model",
        "title": "Understanding the GPU and CUDA Execution Model",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 7,
        "description": "A detailed guide to SIMT execution, warps, occupancy, memory coalescing, tiling, and the performance principles behind CUDA kernels.",
        "tags": [
            "GPU",
            "CUDA",
            "parallel computing"
        ]
    },
    {
        "slug": "distributed-training-and-inference",
        "title": "Distributed Training and Inference for Large Models",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 8,
        "description": "A detailed guide to data, tensor, and pipeline parallelism, sharded state, checkpointing, mixed precision, and disaggregated inference.",
        "tags": [
            "distributed training",
            "LLM",
            "parallelism"
        ]
    },
    {
        "slug": "llm-inference-optimization",
        "title": "LLM Inference Optimization: Attention, KV Caches, and Speculative Decoding",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 9,
        "description": "An in-depth study of FlashAttention, PagedAttention, GQA, RoPE, MLA, and exact speculative decoding for efficient LLM serving.",
        "tags": [
            "LLM",
            "inference",
            "FlashAttention"
        ]
    },
    {
        "slug": "hardware-acceleration-roofline-tpu",
        "title": "Hardware Acceleration: Roofline Analysis, CNN Dataflow, and Systolic Arrays",
        "date": "2026-06-20",
        "category": "Machine Learning Acceleration",
        "order": 10,
        "description": "A detailed study of data movement, roofline analysis, convolution loop mapping, local memory, systolic arrays, HBM, and numerical formats.",
        "tags": [
            "hardware acceleration",
            "TPU",
            "roofline"
        ]
    },
    {
        "slug": "linear-programming-and-simplex",
        "title": "Linear Programming and the Simplex Method",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 1,
        "description": "A geometric and algebraic guide to linear programs, standard form, slack variables, basic feasible solutions, pivots, and simplex optimality.",
        "tags": [
            "linear programming",
            "simplex",
            "convex optimization"
        ]
    },
    {
        "slug": "quadratic-and-conic-optimization",
        "title": "Quadratic and Conic Optimization: QP, Least Squares, and SOCP",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 2,
        "description": "A detailed guide to convex quadratic programs, equality-constrained least squares, KKT systems, second-order cones, and robust reformulations.",
        "tags": [
            "quadratic programming",
            "SOCP",
            "convex optimization"
        ]
    },
    {
        "slug": "semidefinite-programming-and-relaxation",
        "title": "Semidefinite Programming: Matrix Inequalities and Convex Relaxation",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 3,
        "description": "A detailed introduction to PSD matrices, linear matrix inequalities, SDP, Schur complements, and the MAXCUT semidefinite relaxation.",
        "tags": [
            "semidefinite programming",
            "convex relaxation",
            "MAXCUT"
        ]
    },
    {
        "slug": "gradient-descent-convergence",
        "title": "Gradient Descent: Smoothness, Convexity, and Convergence",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 4,
        "description": "A rigorous guide to gradient descent, smoothness, convexity, strong convexity, convergence rates, and the geometry of conditioning.",
        "tags": [
            "gradient descent",
            "convex optimization",
            "convergence"
        ]
    },
    {
        "slug": "momentum-and-adaptive-optimizers",
        "title": "Momentum and Adaptive Optimizers: From Nesterov to AdamW",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 5,
        "description": "A detailed comparison of momentum, Nesterov acceleration, AdaGrad, RMSProp, Adam, AdamW, and memory-efficient optimizer variants.",
        "tags": [
            "momentum",
            "Adam",
            "adaptive optimization"
        ]
    },
    {
        "slug": "newton-and-quasi-newton-methods",
        "title": "Newton and Quasi-Newton Methods: Curvature as a Coordinate System",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 6,
        "description": "A detailed guide to Newton's method, damping, line search, quadratic convergence, BFGS, L-BFGS, and modern second-order approximations.",
        "tags": [
            "Newton method",
            "BFGS",
            "second-order optimization"
        ]
    },
    {
        "slug": "duality-augmented-lagrangian-admm",
        "title": "Duality, Augmented Lagrangians, and ADMM",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 7,
        "description": "A detailed guide to Lagrangian duality, dual gradient ascent, augmented Lagrangians, the method of multipliers, and ADMM splitting.",
        "tags": [
            "duality",
            "ADMM",
            "constrained optimization"
        ]
    },
    {
        "slug": "distributed-optimization-algorithms",
        "title": "Distributed Optimization: Local SGD, Consensus, and Communication",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 8,
        "description": "A detailed guide to parallel SGD, local SGD, FedAvg, decentralized optimization, topology, compression, asynchrony, and robust aggregation.",
        "tags": [
            "distributed optimization",
            "federated learning",
            "consensus"
        ]
    },
    {
        "slug": "nonconvex-optimization-in-modern-ml",
        "title": "Nonconvex Optimization in Modern Machine Learning",
        "date": "2026-06-20",
        "category": "Optimization",
        "order": 9,
        "description": "How duality, ADMM, second-order geometry, and coordinate transformations appear in continual learning, pruning, sharpness-aware training, and pipelines.",
        "tags": [
            "nonconvex optimization",
            "machine learning",
            "research"
        ]
    }
];
