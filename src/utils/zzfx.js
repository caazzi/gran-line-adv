// ZzFX - Zuper Zmall Zeckless Zound Zynthesizer
// MIT License - Copyright 2019 Frank Force

const zzfx = (...t) => zzfxP(zzfxG(...t));
const zzfxP = (...t) => {
    let e = zzfxX.createBufferSource(),
        f = zzfxX.createBuffer(t.length, t[0].length, zzfxR);
    return t.map((d, i) => f.getChannelData(i).set(d)), e.buffer = f, e.connect(zzfxX.destination), e.start(), e;
};
const zzfxG = (t = 1, e = .05, f = 220, d = 0, o = 0, a = .1, r = 0, h = 1, n = 0, z = 0, s = 0, c = 0, x = 0, m = 0, b = 0, l = 0, j = 0, u = 1, w = 0, I = 0) => {
    let p = 2 * Math.PI, R = 44100, M = Math, A = M.random, C = M.sin, P = M.cos, B = (t = 1) => M.max(0, t), q = (t = 0, e = 1) => B(R * t) | 0, F = q(o), G = q(a), H = q(r), J = q(m), K = q(b), L = q(l), N = q(j), O = [], Q = 0, S = 0, T = 0, U = 1, V = 0, W = 0, X = 0, Y = f = (f * p) / R, Z = f * (1 + 2 * w);
    for (let $ = h *= 500 * p / R ** 2, _ = 0, D = (d *= 500 * p / R ** 3), E = 0, tt = 0; tt < F + G + H; tt++) {
        let et = 1, ft = 0;
        V = (V + 1) % 1E8;
        if (tt < F) {
            et = tt / F;
        } else if (tt < F + G) {
            et = 1 - (tt - F) / G * (1 - u);
        } else {
            et = u - (tt - F - G) / H * u;
        }
        C = M.sin(X);
        if (n) {
            C = M.abs(C) * 2 - 1;
        }
        if (s) {
            C = V % (1E8 / (Z / p)) < 1E8 / (Z / p) * c ? 1 : -1;
        }
        if (I) {
            C = A() * 2 - 1;
        }
        _ += D;
        $ += _;
        Y += $;
        Z += $;
        X += Z;
        if (J && tt > J) {
            f = Z = Z * 1E5;
            J = 0;
        }
        if (L && tt > L) {
            Y += K;
        }
        if (N && tt > N) {
            Y -= K;
        }
        T += (C - T) * (1 - (e > 0 ? M.exp(-e / R) : 0));
        Q += (T - Q) * (1 - (z > 0 ? M.exp(-z / R) : 0));
        O[tt] = Q * t * et;
    }
    return [O];
};

const zzfxR = 44100;
const zzfxX = new (window.AudioContext || window.webkitAudioContext)();

export { zzfx };
