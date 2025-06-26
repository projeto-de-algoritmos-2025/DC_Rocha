document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const calculateBtn = document.getElementById('calculateBtn');
    const num1Input = document.getElementById('num1');
    const num2Input = document.getElementById('num2');
    const resultsContainer = document.getElementById('results-container');
    
    // Contadores de operações globais
    let opCounts = { standard: 0, karatsuba: 0 };

    // --- FUNÇÕES AUXILIARES ---
    const decToBin = (dec) => (dec >>> 0).toString(2);
    const binToDec = (bin) => parseInt(bin, 2) || 0;
    const pad = (binStr, len) => binStr.padStart(len, '0');

    const binaryAdd = (a, b) => {
        let res = '', carry = 0, len = Math.max(a.length, b.length);
        a = pad(a, len); b = pad(b, len);
        for (let i = len - 1; i >= 0; i--) {
            const sum = parseInt(a[i]) + parseInt(b[i]) + carry;
            res = (sum % 2) + res;
            carry = Math.floor(sum / 2);
        }
        return carry ? '1' + res : res;
    };
    
    const binarySubtract = (a, b) => {
        let res = '', borrow = 0, len = a.length;
        b = pad(b, len);
        for (let i = len - 1; i >= 0; i--) {
            let sub = parseInt(a[i]) - parseInt(b[i]) - borrow;
            borrow = 0;
            if (sub < 0) { sub += 2; borrow = 1; }
            res = sub + res;
        }
        return res.replace(/^0+/, '') || '0';
    };

    // --- ALGORITMOS DE MULTIPLICAÇÃO ---

    function standardMultiplication(x, y) {
        opCounts.standard = 0;
        const n = y.length;
        let partialProducts = [], steps = `  ${pad(x, x.length + n)}\nx ${pad(y, x.length + n)}\n${'-'.repeat(x.length + n)}\n`;
        
        for (let i = n - 1; i >= 0; i--) {
            const shift = n - 1 - i;
            if (y[i] === '1') {
                let p = x + '0'.repeat(shift);
                partialProducts.push(p);
                steps += `  ${pad(p, x.length + n)}\n`;
                opCounts.standard += x.length;
            } else {
                steps += `  ${pad('0'.repeat(x.length + shift), x.length + n)}\n`;
            }
        }
        steps += '-'.repeat(x.length + n) + '\n';
        const result = partialProducts.reduce((acc, p) => binaryAdd(acc, p), '0');
        steps += `  ${pad(result, x.length + n)} (Resultado)`;
        return { result, steps };
    }

    function karatsuba(x, y) {
        if (karatsuba.caller.name !== 'karatsuba') { opCounts.karatsuba = 0; }
        
        let n = Math.max(x.length, y.length);
        if (n <= 4) {
            opCounts.karatsuba += x.length * y.length;
            return decToBin(binToDec(x) * binToDec(y));
        }
        n = (n % 2 === 0) ? n : n + 1;
        x = pad(x, n); y = pad(y, n);

        const half = n / 2;
        const a = x.substring(0, half), b = x.substring(half);
        const c = y.substring(0, half), d = y.substring(half);

        const p1 = karatsuba(a, c);
        const p2 = karatsuba(b, d);
        const p3 = karatsuba(binaryAdd(a, b), binaryAdd(c, d));

        const p_middle = binarySubtract(binarySubtract(p3, p1), p2);

        const term1 = p1 + '0'.repeat(n);
        const term2 = p_middle + '0'.repeat(half);
        return binaryAdd(binaryAdd(term1, term2), p2);
    }
    
    // --- LÓGICA DE VISUALIZAÇÃO ---
    
    function visualizeKaratsuba(x, y) {
        let n = Math.max(x.length, y.length);
        n = (n % 2 === 0) ? n : n + 1;
        x = pad(x, n); y = pad(y, n);
        
        const half = n / 2;
        const a = x.substring(0, half), b = x.substring(half);
        const c = y.substring(0, half), d = y.substring(half);

        // -- Etapa 1: DIVIDIR --
        const divideHtml = `
            <p>X = <span class="binary-split"><span class="part-a">${a}</span><span class="part-b">${b}</span></span> (x₁ | x₀)</p>
            <p>Y = <span class="binary-split"><span class="part-c">${c}</span><span class="part-d">${d}</span></span> (y₁ | y₀)</p>
        `;
        document.getElementById('divide-step').innerHTML = divideHtml;

        // -- Etapa 2: CONQUISTAR --
        const p1 = karatsuba(a, c);
        const p2 = karatsuba(b, d);
        const a_plus_b = binaryAdd(a, b);
        const c_plus_d = binaryAdd(c, d);
        const p3 = karatsuba(a_plus_b, c_plus_d);
        
        const conquerHtml = `
            <div class="computation-card">
                <div class="title">A</div>
                <div class="formula">x₁ &times; y₁</div>
                <div class="formula">${a} &times; ${c}</div>
                <div class="result">${p1}</div>
            </div>
            <div class="computation-card">
                <div class="title">B</div>
                <div class="formula">(x₁ + x₀) &times; (y₁+y₀)</div>
                <div class="formula">${a_plus_b} &times; ${c_plus_d}</div>
                <div class="result">${p3}</div>
            </div>
            <div class="computation-card">
                <div class="title">C</div>
                <div class="formula">x₀ &times; y₀</div>
                <div class="formula">${b} &times; ${d}</div>
                <div class="result">${p2}</div>
            </div>
        `;
        document.getElementById('conquer-step').innerHTML = conquerHtml;

        // -- Etapa 3: COMBINAR --
        const p_middle = binarySubtract(binarySubtract(p3, p1), p2);
        const term1 = p1 + '0'.repeat(n);
        const term2 = p_middle + '0'.repeat(half);
        const finalResult = binaryAdd(binaryAdd(term1, term2), p2);

        const maxLen = finalResult.length;
        const combineHtml = `
<p>Fórmula final: 2<sup>n</sup>A - 2<sup>n/2</sup>(B-A-C) + C</p>
<p>Termo do meio = B - A - C = ${p_middle}</p>
<pre>
  ${pad(term1, maxLen)}  (A, shift de ${n})
+ ${pad(term2, maxLen)}  (Termo do meio, shift de ${half})
+ ${pad(p2, maxLen)}  (C, sem shift)
${'-'.repeat(maxLen)}
= ${pad(finalResult, maxLen)}  (Resultado Final)
</pre>
        `;
        document.getElementById('combine-step').innerHTML = combineHtml;
    }

    function calculateAndDisplay() {
        resultsContainer.classList.remove('hidden');
        
        const val1 = parseInt(num1Input.value), val2 = parseInt(num2Input.value);
        if (isNaN(val1) || isNaN(val2) || val1 < 0 || val2 < 0) {
            alert("Por favor, insira números inteiros não negativos.");
            return;
        }
        
        const bin1 = decToBin(val1), bin2 = decToBin(val2);
        
        // --- Cálculo e Exibição do Método Padrão ---
        const standard = standardMultiplication(bin1, bin2);
        document.getElementById('standard-steps').textContent = standard.steps;
        document.getElementById('standard-ops').textContent = `Multiplicações de 1 bit: ${opCounts.standard.toLocaleString('pt-BR')}`;
        
        // --- Cálculo e Visualização do Karatsuba ---
        // A chamada principal reseta o contador
        const karatsubaResult = karatsuba(bin1, bin2); 
        // A visualização usa os valores calculados
        visualizeKaratsuba(bin1, bin2);

        document.getElementById('karatsuba-ops').textContent = `Multiplicações de 1 bit (recursivas): ${opCounts.karatsuba.toLocaleString('pt-BR')}`;
        
        // --- Resumo Final ---
        const decimalResult = binToDec(karatsubaResult);
        document.getElementById('summary-text').innerHTML = `
            ${val1} &times; ${val2} = <strong>${decimalResult.toLocaleString('pt-BR')}</strong><br>
            Resultado em Binário: <strong>${karatsubaResult}</strong>
        `;

        // Animação de entrada dos cartões
        document.querySelectorAll('.step-card').forEach((card, index) => {
            setTimeout(() => card.classList.add('visible'), index * 200);
        });

        // Renderiza as fórmulas LaTeX
        MathJax.typeset();
    }

    calculateBtn.addEventListener('click', () => {
        // Reseta a visibilidade para a animação rodar novamente
        document.querySelectorAll('.step-card').forEach(card => card.classList.remove('visible'));
        calculateAndDisplay();
    });
    
    // Exibe um cálculo inicial ao carregar a página
    calculateAndDisplay();
});