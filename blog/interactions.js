(function () {
    const COLORS = {
        indigo: '#4f46e5',
        violet: '#7c3aed',
        ink: '#1e293b',
        muted: '#64748b',
        grid: '#e8e7f2',
        rose: '#ec4899',
        cyan: '#0891b2',
    };

    function slugify(text, used) {
        const base = text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'section';
        let slug = base;
        let suffix = 2;
        while (used.has(slug)) slug = `${base}-${suffix++}`;
        used.add(slug);
        return slug;
    }

    function buildTableOfContents(root) {
        const content = root.querySelector('.post-content');
        const nav = root.querySelector('#post-toc-nav');
        if (!content || !nav) return;

        const headings = [...content.querySelectorAll('h2, h3')];
        const used = new Set();
        headings.forEach(heading => {
            heading.id = heading.id || slugify(heading.textContent, used);
        });

        nav.innerHTML = headings.map(heading =>
            `<a href="#${heading.id}" data-level="${heading.tagName.slice(1)}">${heading.textContent}</a>`
        ).join('');

        if (!headings.length) {
            root.querySelector('.post-toc').hidden = true;
            return;
        }

        nav.addEventListener('click', event => {
            const link = event.target.closest('a');
            if (!link) return;
            event.preventDefault();
            document.getElementById(link.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', link.hash);
        });

        const links = [...nav.querySelectorAll('a')];
        const activate = () => {
            const marker = window.scrollY + 130;
            let current = headings[0];
            headings.forEach(heading => {
                const top = heading.getBoundingClientRect().top + window.scrollY;
                if (top <= marker) current = heading;
            });
            links.forEach(link => link.classList.toggle('active', link.hash === `#${current.id}`));
        };
        window.addEventListener('scroll', activate, { passive: true });
        activate();
    }

    function setupReadingProgress(root) {
        const bar = document.getElementById('post-reading-progress');
        const article = root.querySelector('.post-article');
        if (!bar || !article) return;

        const update = () => {
            const start = article.getBoundingClientRect().top + window.scrollY;
            const distance = Math.max(1, article.offsetHeight - window.innerHeight);
            const progress = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
            bar.style.width = `${progress * 100}%`;
        };
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    function createShell(host, title, copy) {
        host.innerHTML = `
            <div class="interactive-demo-header">
                <div>
                    <div class="interactive-demo-kicker">Interactive playground</div>
                    <div class="interactive-demo-title">${title}</div>
                    <div class="interactive-demo-copy">${copy}</div>
                </div>
            </div>
            <div class="interactive-demo-stage"><canvas width="720" height="360"></canvas></div>
            <div class="interactive-demo-controls"></div>
        `;
        return {
            canvas: host.querySelector('canvas'),
            controls: host.querySelector('.interactive-demo-controls'),
        };
    }

    function addButton(controls, label, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', onClick);
        controls.appendChild(button);
        return button;
    }

    function addRange(controls, label, min, max, step, value, onInput) {
        const wrapper = document.createElement('label');
        wrapper.className = 'interactive-control';
        const text = document.createElement('span');
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        const update = () => {
            text.textContent = `${label}: ${Number(input.value).toFixed(step < 1 ? 2 : 0)}`;
            onInput(Number(input.value));
        };
        input.addEventListener('input', update);
        wrapper.append(text, input);
        controls.appendChild(wrapper);
        text.textContent = `${label}: ${Number(input.value).toFixed(step < 1 ? 2 : 0)}`;
        return input;
    }

    function addSelect(controls, label, options, value, onChange) {
        const wrapper = document.createElement('label');
        wrapper.className = 'interactive-control';
        const text = document.createElement('span');
        text.textContent = label;
        const select = document.createElement('select');
        options.forEach(option => {
            const node = document.createElement('option');
            node.value = option.value;
            node.textContent = option.label;
            select.appendChild(node);
        });
        select.value = value;
        select.addEventListener('change', () => onChange(select.value));
        wrapper.append(text, select);
        controls.appendChild(wrapper);
        return select;
    }

    function addMetric(controls) {
        const metric = document.createElement('div');
        metric.className = 'interactive-metric';
        controls.appendChild(metric);
        return metric;
    }

    function optimizerDemo(host, method) {
        const names = { gd: 'Gradient Descent', momentum: 'Momentum', newton: "Newton's Method" };
        const { canvas, controls } = createShell(
            host,
            `${names[method]} on an ill-conditioned quadratic`,
            'Click the landscape to choose a starting point. Step through the optimizer and watch how curvature changes its path.'
        );
        const ctx = canvas.getContext('2d');
        let eta = method === 'newton' ? 1 : 0.12;
        let condition = 6;
        let point;
        let velocity;
        let path;
        let timer = null;

        function reset() {
            point = { x: 3.1, y: 2.15 };
            velocity = { x: 0, y: 0 };
            path = [{ ...point }];
            draw();
        }

        function project(p) {
            return { x: 360 + p.x * 92, y: 180 - p.y * 68 };
        }

        function unproject(x, y) {
            return { x: (x - 360) / 92, y: (180 - y) / 68 };
        }

        function step() {
            const gradient = { x: point.x, y: condition * point.y };
            if (method === 'momentum') {
                velocity.x = 0.82 * velocity.x + gradient.x;
                velocity.y = 0.82 * velocity.y + gradient.y;
                point.x -= eta * velocity.x;
                point.y -= eta * velocity.y;
            } else if (method === 'newton') {
                point.x -= eta * gradient.x;
                point.y -= eta * gradient.y / condition;
            } else {
                point.x -= eta * gradient.x;
                point.y -= eta * gradient.y;
            }
            if (!Number.isFinite(point.x + point.y) || Math.abs(point.x) > 20 || Math.abs(point.y) > 20) {
                stop();
            }
            path.push({ ...point });
            if (path.length > 80) path.shift();
            draw();
        }

        function stop() {
            if (timer) window.clearInterval(timer);
            timer = null;
            play.textContent = 'Play';
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let level = 0.5; level <= 16; level *= 1.55) {
                ctx.beginPath();
                ctx.ellipse(360, 180, Math.sqrt(2 * level) * 92, Math.sqrt(2 * level / condition) * 68, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(79,70,229,${0.08 + level / 150})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            ctx.strokeStyle = COLORS.grid;
            ctx.beginPath();
            ctx.moveTo(0, 180); ctx.lineTo(720, 180);
            ctx.moveTo(360, 0); ctx.lineTo(360, 360);
            ctx.stroke();

            if (path.length > 1) {
                ctx.beginPath();
                path.forEach((p, index) => {
                    const q = project(p);
                    if (index === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
                });
                ctx.strokeStyle = COLORS.rose;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }

            const current = project(point);
            ctx.beginPath();
            ctx.arc(current.x, current.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.violet;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(360, 180, 4, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.ink;
            ctx.fill();
            metric.textContent = `step ${path.length - 1} · f(x) = ${(.5 * (point.x ** 2 + condition * point.y ** 2)).toFixed(4)}`;
        }

        canvas.addEventListener('pointerdown', event => {
            const rect = canvas.getBoundingClientRect();
            point = unproject((event.clientX - rect.left) * canvas.width / rect.width,
                (event.clientY - rect.top) * canvas.height / rect.height);
            velocity = { x: 0, y: 0 };
            path = [{ ...point }];
            draw();
        });

        if (method !== 'newton') {
            addRange(controls, 'step size', 0.02, 0.32, 0.01, eta, value => { eta = value; reset(); });
        } else {
            addRange(controls, 'damping', 0.1, 1, 0.05, eta, value => { eta = value; reset(); });
        }
        addRange(controls, 'condition', 2, 14, 1, condition, value => { condition = value; reset(); });
        addButton(controls, 'Step', step);
        const play = addButton(controls, 'Play', () => {
            if (timer) return stop();
            play.textContent = 'Pause';
            timer = window.setInterval(step, 320);
        });
        addButton(controls, 'Reset', () => { stop(); reset(); });
        const metric = addMetric(controls);
        reset();
    }

    function quantizationDemo(host) {
        const { canvas, controls } = createShell(
            host,
            'Quantization error and clipping',
            'Change bit width and clipping range. The purple staircase is the quantized approximation of the smooth signal.'
        );
        const ctx = canvas.getContext('2d');
        let bits = 3;
        let clip = 1.3;

        function signal(x) { return 1.05 * Math.sin(1.35 * x) + 0.22 * x; }
        function quantize(y) {
            const levels = 2 ** bits - 1;
            const clipped = Math.max(-clip, Math.min(clip, y));
            return Math.round((clipped + clip) / (2 * clip) * levels) / levels * (2 * clip) - clip;
        }
        function px(x) { return 50 + (x + 3) / 6 * 630; }
        function py(y) { return 180 - y / 2 * 140; }

        function draw() {
            ctx.clearRect(0, 0, 720, 360);
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 720, 360);
            ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(45, 180); ctx.lineTo(685, 180); ctx.stroke();
            ctx.setLineDash([5, 5]);
            [-clip, clip].forEach(y => { ctx.beginPath(); ctx.moveTo(45, py(y)); ctx.lineTo(685, py(y)); ctx.stroke(); });
            ctx.setLineDash([]);

            ctx.beginPath();
            let mse = 0;
            for (let i = 0; i <= 240; i++) {
                const x = -3 + i / 40;
                const y = signal(x);
                if (i === 0) ctx.moveTo(px(x), py(y)); else ctx.lineTo(px(x), py(y));
                mse += (y - quantize(y)) ** 2;
            }
            ctx.strokeStyle = COLORS.muted; ctx.lineWidth = 2; ctx.stroke();

            ctx.beginPath();
            for (let i = 0; i <= 240; i++) {
                const x = -3 + i / 40;
                const y = quantize(signal(x));
                if (i === 0) ctx.moveTo(px(x), py(y)); else ctx.lineTo(px(x), py(y));
            }
            ctx.strokeStyle = COLORS.violet; ctx.lineWidth = 3; ctx.stroke();
            metric.textContent = `${bits}-bit · ${(2 ** bits)} levels · MSE ${(mse / 241).toFixed(4)}`;
        }

        addRange(controls, 'bits', 2, 8, 1, bits, value => { bits = value; draw(); });
        addRange(controls, 'clip', 0.6, 2, 0.05, clip, value => { clip = value; draw(); });
        const metric = addMetric(controls);
        draw();
    }

    function diffusionDemo(host) {
        const { canvas, controls } = createShell(
            host,
            'Forward diffusion through time',
            'Move the timestep to mix a simple image with a fixed Gaussian-like noise field.'
        );
        const ctx = canvas.getContext('2d');
        const size = 96;
        const offscreen = document.createElement('canvas');
        offscreen.width = size; offscreen.height = size;
        const off = offscreen.getContext('2d');
        let timestep = 0;

        function hash(i) {
            const value = Math.sin(i * 127.1 + 311.7) * 43758.5453;
            return value - Math.floor(value);
        }
        function cleanPixel(x, y) {
            const sky = [32 + y * .35, 52 + y * .42, 92 + y * .55];
            const dx = x - 48, dy = y - 48;
            if (dx * dx + dy * dy < 22 * 22) return [242, 181, 75];
            if (y > 70) return [35, 71 + (x % 9) * 2, 65];
            return sky;
        }
        function draw() {
            const image = off.createImageData(size, size);
            const alpha = timestep / 100;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const base = cleanPixel(x, y);
                    const index = (y * size + x) * 4;
                    for (let channel = 0; channel < 3; channel++) {
                        const noise = hash(index + channel) * 255;
                        image.data[index + channel] = base[channel] * (1 - alpha) + noise * alpha;
                    }
                    image.data[index + 3] = 255;
                }
            }
            off.putImageData(image, 0, 0);
            ctx.clearRect(0, 0, 720, 360);
            ctx.fillStyle = '#f8f7ff'; ctx.fillRect(0, 0, 720, 360);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(offscreen, 200, 20, 320, 320);
            ctx.strokeStyle = '#d9d6ef'; ctx.strokeRect(200, 20, 320, 320);
            metric.textContent = `t = ${timestep} · signal ${(1 - alpha).toFixed(2)} · noise ${alpha.toFixed(2)}`;
        }

        addRange(controls, 'timestep', 0, 100, 1, timestep, value => { timestep = value; draw(); });
        const metric = addMetric(controls);
        draw();
    }

    function consensusDemo(host) {
        const { canvas, controls } = createShell(
            host,
            'Consensus over a communication graph',
            'Each node starts with a different value. One mixing step averages information with its graph neighbors.'
        );
        const ctx = canvas.getContext('2d');
        const initial = [0.05, 0.9, 0.25, 0.72, 0.15, 0.98, 0.42, 0.63];
        let values = [...initial];
        let topology = 'ring';
        let steps = 0;
        let timer = null;

        function edges() {
            const result = [];
            for (let i = 0; i < values.length; i++) {
                if (topology === 'ring') result.push([i, (i + 1) % values.length]);
                else for (let j = i + 1; j < values.length; j++) result.push([i, j]);
            }
            return result;
        }
        function positions() {
            return values.map((_, i) => ({
                x: 360 + 125 * Math.cos(-Math.PI / 2 + i * Math.PI * 2 / values.length),
                y: 180 + 125 * Math.sin(-Math.PI / 2 + i * Math.PI * 2 / values.length),
            }));
        }
        function mix() {
            const next = values.map((value, i) => {
                if (topology === 'complete') return values.reduce((a, b) => a + b, 0) / values.length;
                return (values[(i - 1 + values.length) % values.length] + 2 * value + values[(i + 1) % values.length]) / 4;
            });
            values = next; steps++; draw();
        }
        function stop() {
            if (timer) clearInterval(timer);
            timer = null; play.textContent = 'Play';
        }
        function reset() { stop(); values = [...initial]; steps = 0; draw(); }
        function draw() {
            ctx.clearRect(0, 0, 720, 360); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 720, 360);
            const pos = positions();
            ctx.strokeStyle = '#d9d6ef'; ctx.lineWidth = 1.3;
            edges().forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a].x, pos[a].y); ctx.lineTo(pos[b].x, pos[b].y); ctx.stroke(); });
            pos.forEach((p, i) => {
                const value = values[i];
                ctx.beginPath(); ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${245 + value * 35} 75% ${82 - value * 32}%)`; ctx.fill();
                ctx.strokeStyle = COLORS.violet; ctx.stroke();
                ctx.fillStyle = value > .55 ? '#fff' : COLORS.ink;
                ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(value.toFixed(2), p.x, p.y);
            });
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
            metric.textContent = `round ${steps} · mean ${mean.toFixed(3)} · disagreement ${variance.toFixed(5)}`;
        }

        addSelect(controls, 'topology', [{ value: 'ring', label: 'Ring' }, { value: 'complete', label: 'Complete' }], topology,
            value => { topology = value; reset(); });
        addButton(controls, 'Mix once', mix);
        const play = addButton(controls, 'Play', () => {
            if (timer) return stop();
            play.textContent = 'Pause'; timer = setInterval(mix, 450);
        });
        addButton(controls, 'Reset', reset);
        const metric = addMetric(controls);
        draw();
    }

    function convolutionDemo(host) {
        const { canvas, controls } = createShell(
            host,
            'Convolution as a sliding local operator',
            'Click input cells, then switch kernels to see how a 3×3 filter transforms the 7×7 feature map.'
        );
        const ctx = canvas.getContext('2d');
        let input;
        let kernelName = 'edge';
        const kernels = {
            edge: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
            blur: [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]],
            sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
        };
        function reset() {
            input = Array.from({ length: 7 }, (_, y) => Array.from({ length: 7 }, (_, x) =>
                (x >= 2 && x <= 4 && y >= 2 && y <= 4) ? 1 : 0
            ));
            draw();
        }
        function output() {
            const k = kernels[kernelName];
            return Array.from({ length: 5 }, (_, y) => Array.from({ length: 5 }, (_, x) => {
                let sum = 0;
                for (let ky = 0; ky < 3; ky++) for (let kx = 0; kx < 3; kx++) sum += input[y + ky][x + kx] * k[ky][kx];
                return sum;
            }));
        }
        function drawGrid(data, startX, startY, cell, label, signed) {
            ctx.fillStyle = COLORS.ink; ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(label, startX, startY - 12);
            const max = Math.max(1, ...data.flat().map(Math.abs));
            data.forEach((row, y) => row.forEach((value, x) => {
                const intensity = Math.abs(value) / max;
                ctx.fillStyle = signed && value < 0
                    ? `rgba(236,72,153,${0.1 + intensity * .75})`
                    : `rgba(79,70,229,${0.08 + intensity * .78})`;
                ctx.fillRect(startX + x * cell, startY + y * cell, cell - 2, cell - 2);
            }));
        }
        function draw() {
            ctx.clearRect(0, 0, 720, 360); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 720, 360);
            drawGrid(input, 65, 65, 34, 'Input 7×7', false);
            drawGrid(kernels[kernelName], 325, 105, 34, 'Kernel 3×3', true);
            drawGrid(output(), 480, 90, 42, 'Output 5×5', true);
            ctx.fillStyle = COLORS.muted; ctx.font = '12px Inter, sans-serif';
            ctx.fillText('click cells', 65, 325);
            metric.textContent = `${kernelName} kernel · 25 output positions`;
        }
        canvas.addEventListener('pointerdown', event => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * 720 / rect.width;
            const y = (event.clientY - rect.top) * 360 / rect.height;
            const col = Math.floor((x - 65) / 34);
            const row = Math.floor((y - 65) / 34);
            if (row >= 0 && row < 7 && col >= 0 && col < 7) {
                input[row][col] = input[row][col] ? 0 : 1;
                draw();
            }
        });
        addSelect(controls, 'kernel', [
            { value: 'edge', label: 'Edge detection' },
            { value: 'blur', label: 'Blur' },
            { value: 'sharpen', label: 'Sharpen' },
        ], kernelName, value => { kernelName = value; draw(); });
        addButton(controls, 'Reset input', reset);
        const metric = addMetric(controls);
        reset();
    }

    function trustRegionDemo(host) {
        const { canvas, controls } = createShell(
            host,
            'Euclidean vs. natural policy gradient',
            'The ellipse is a local KL ball. Change its radius and Fisher anisotropy to compare two ascent directions under the same KL budget.'
        );
        const ctx = canvas.getContext('2d');
        const center = { x: 360, y: 180 };
        const scale = 225;
        const gradient = { x: 1, y: 0.72 };
        let delta = 0.08;
        let anisotropy = 7;

        function boundaryStep(direction) {
            const fisherNorm = direction.x ** 2 + anisotropy * direction.y ** 2;
            const factor = Math.sqrt(2 * delta / fisherNorm);
            return { x: factor * direction.x, y: factor * direction.y };
        }

        function point(step) {
            return { x: center.x + step.x * scale, y: center.y - step.y * scale };
        }

        function arrow(step, color, label, offset) {
            const end = point(step);
            const angle = Math.atan2(end.y - center.y, end.x - center.x);
            ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - 11 * Math.cos(angle - .45), end.y - 11 * Math.sin(angle - .45));
            ctx.lineTo(end.x - 11 * Math.cos(angle + .45), end.y - 11 * Math.sin(angle + .45));
            ctx.closePath(); ctx.fillStyle = color; ctx.fill();
            ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(label, end.x + 8, end.y + offset);
        }

        function draw() {
            ctx.clearRect(0, 0, 720, 360);
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 720, 360);
            ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(70, center.y); ctx.lineTo(650, center.y); ctx.moveTo(center.x, 35); ctx.lineTo(center.x, 325); ctx.stroke();

            const radiusX = Math.sqrt(2 * delta) * scale;
            const radiusY = Math.sqrt(2 * delta / anisotropy) * scale;
            for (const factor of [1, .66, .33]) {
                ctx.beginPath();
                ctx.ellipse(center.x, center.y, radiusX * factor, radiusY * factor, 0, 0, Math.PI * 2);
                ctx.fillStyle = factor === 1 ? 'rgba(79,70,229,.055)' : 'transparent';
                ctx.fill();
                ctx.strokeStyle = factor === 1 ? 'rgba(79,70,229,.65)' : 'rgba(79,70,229,.16)';
                ctx.lineWidth = factor === 1 ? 2 : 1;
                ctx.stroke();
            }

            const euclidean = boundaryStep(gradient);
            const naturalDirection = { x: gradient.x, y: gradient.y / anisotropy };
            const natural = boundaryStep(naturalDirection);
            arrow(euclidean, COLORS.rose, 'gradient', 17);
            arrow(natural, COLORS.violet, 'natural gradient', -8);

            ctx.beginPath(); ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.ink; ctx.fill();
            ctx.fillStyle = COLORS.muted; ctx.font = '12px Inter, sans-serif';
            ctx.fillText('old policy', center.x + 9, center.y + 17);

            const gainE = gradient.x * euclidean.x + gradient.y * euclidean.y;
            const gainN = gradient.x * natural.x + gradient.y * natural.y;
            metric.textContent = `KL radius ${delta.toFixed(2)} · predicted gain: gradient ${gainE.toFixed(3)}, natural ${gainN.toFixed(3)}`;
        }

        addRange(controls, 'KL radius', 0.01, 0.2, 0.01, delta, value => { delta = value; draw(); });
        addRange(controls, 'anisotropy', 1, 12, 1, anisotropy, value => { anisotropy = value; draw(); });
        const metric = addMetric(controls);
        draw();
    }

    const demos = {
        'optimizer-gd': host => optimizerDemo(host, 'gd'),
        'optimizer-momentum': host => optimizerDemo(host, 'momentum'),
        'optimizer-newton': host => optimizerDemo(host, 'newton'),
        quantization: quantizationDemo,
        diffusion: diffusionDemo,
        consensus: consensusDemo,
        convolution: convolutionDemo,
        'trust-region': trustRegionDemo,
    };

    window.initializeInteractivePost = function (root) {
        buildTableOfContents(root);
        setupReadingProgress(root);
        root.querySelectorAll('[data-demo]').forEach(host => {
            const render = demos[host.dataset.demo];
            if (render) render(host);
        });
    };
})();
