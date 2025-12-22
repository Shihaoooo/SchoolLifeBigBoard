// --- 1. 数据 Mock (env: [湿度, 温度]) ---
    const mockData = {
        'library': { name: '博文馆 (图书馆)', value: 85, gender: [40, 60], env: [45, 24], type: 'lib' }, // 湿度45, 温度24 (舒适)
        'zhijin':  { name: '知津楼 (教学区A)', value: 35, gender: [55, 45], env: [50, 18], type: 'edu' }, // 人少 (绿)
        'gezhi':   { name: '格致楼 (教学区B)', value: 65, gender: [75, 25], env: [65, 26], type: 'edu' }, // 人中 (黄)
        'canteen1':{ name: '一食堂', value: 92, gender: [50, 50], env: [75, 30], type: 'food' }, // 人多(红), 湿热(红/黄)
        'canteen2':{ name: '二食堂', value: 55, gender: [55, 45], env: [60, 27], type: 'food' }, 
        'canteen3':{ name: '三食堂', value: 75, gender: [45, 55], env: [55, 28], type: 'food' }
    };

    // --- 2. 连线逻辑 ---
    function drawConnections() {
        const stage = document.getElementById('mapStage');
        const pathEl = document.getElementById('dynamic-connection');
        if(!stage || !pathEl) return;
        const stageRect = stage.getBoundingClientRect();
        const order = ['btn-zhijin', 'btn-gezhi', 'btn-canteen1', 'btn-canteen2', 'btn-canteen3', 'btn-library'];
        let pathD = "";
        order.forEach((id, index) => {
            const el = document.getElementById(id);
            if(el) {
                const rect = el.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - stageRect.left;
                const y = rect.top + rect.height / 2 - stageRect.top;
                pathD += (index === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `);
            }
        });
        pathD += "Z";
        pathEl.setAttribute('d', pathD);
    }

    // --- 3. ECharts 配置 ---
    const darkTheme = {
        textStyle: { color: '#94a3b8' },
        title: { textStyle: { color: '#e2e8f0' } },
        grid: { top: 35, bottom: 25, left: 40, right: 20 },
        categoryAxis: { axisLine: { lineStyle: { color: '#334155' } }, axisTick: { show: false } },
        valueAxis: { splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } }
    };

    let charts = {};

    function initCharts() {
        charts.trend = echarts.init(document.getElementById('chart-trend'));
        charts.trend.setOption({
            ...darkTheme,
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['8:00','10:00','12:00','14:00','16:00'], ...darkTheme.categoryAxis },
            yAxis: { type: 'value', ...darkTheme.valueAxis },
            series: [{
                data: [1200, 3100, 4500, 3800, 4100], type: 'line', smooth: true, itemStyle: { color: '#38bdf8' },
                areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(56,189,248,0.3)'},{offset:1,color:'transparent'}]) }
            }]
        });

        charts.pie = echarts.init(document.getElementById('chart-pie'));
        charts.pie.setOption({
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie', radius: ['45%', '70%'],
                itemStyle: { borderRadius: 4, borderColor: '#0b1120', borderWidth: 2 },
                label: { color: '#cbd5e1' },
                data: [{ value: 45, name: '教学区', itemStyle:{color:'#38bdf8'} }, { value: 30, name: '生活区', itemStyle:{color:'#fbbf24'} }, { value: 25, name: '图书区', itemStyle:{color:'#34d399'} }]
            }]
        });

        charts.radar = echarts.init(document.getElementById('chart-radar'));
        charts.radar.setOption({
            radar: {
                indicator: [{name:'门禁卡'}, {name:'访客'}, {name:'车辆'}, {name:'人脸'}, {name:'其他'}],
                axisName: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } }
            },
            series: [{ type: 'radar', data: [{ value: [90, 40, 50, 80, 20], name: '今日数据' }], itemStyle: { color: '#818cf8' }, areaStyle: { opacity: 0.2 } }]
        });

        charts.gauge = echarts.init(document.getElementById('chart-gauge'));
        charts.bar = echarts.init(document.getElementById('chart-bar'));
        charts.env = echarts.init(document.getElementById('chart-env'));
    }

    // --- 4. 核心逻辑：颜色动态判定 ---

    function handleSelect(id) {
        const data = mockData[id];
        if(!data) return;

        // UI 更新
        document.querySelectorAll('.node-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-' + id).classList.add('active');
        document.getElementById('info-name').innerText = data.name;
        document.getElementById('info-status').innerHTML = `实时人数: ${data.value * 15} &nbsp;|&nbsp; 拥挤度: ${data.value}%`;

        // 图表联动
        updateGauge(data.value);
        updateBar(data.gender);
        updateEnv(data.env);
    }

    // A. 拥挤度仪表盘 - 变色逻辑
    function updateGauge(val) {
        // 阈值判断颜色
        let color = '#34d399'; // 绿色 (优)
        if(val > 40) color = '#38bdf8'; // 蓝色 (良)
        if(val > 60) color = '#fbbf24'; // 黄色 (中)
        if(val > 80) color = '#f87171'; // 红色 (差)

        charts.gauge.setOption({
            series: [{
                type: 'gauge', min:0, max:100,
                axisLine: { lineStyle: { width: 10, color: [[1, 'rgba(255,255,255,0.1)']] } },
                progress: { show: true, width: 10, itemStyle: { color: color } }, // 动态颜色
                pointer: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false },
                detail: { valueAnimation: true, fontSize: 24, offsetCenter: [0,0], formatter: '{value}%', color: '#fff' },
                data: [{ value: val }]
            }]
        });
    }

    // B. 环境柱状图 - 变色逻辑
    function updateEnv(data) {
        charts.env.setOption({
            ...darkTheme,
            xAxis: { type: 'value', ...darkTheme.valueAxis },
            yAxis: { type: 'category', data: ['湿度', '温度'], ...darkTheme.categoryAxis },
            series: [{
                type: 'bar', 
                data: data, 
                barWidth: '50%',
                label: { show: true, position: 'right', color: '#fff' },
                itemStyle: { 
                    borderRadius: [0,4,4,0],
                    // 核心：根据不同数据项（温度/湿度）和数值范围判断颜色
                    color: function(params) {
                        const val = params.value;
                        
                        // params.dataIndex === 1 是温度 (因为data是倒序对应的yAxis)
                        // 注意：ECharts Category Axis 默认从下到上，index 0 是 '湿度', index 1 是 '温度'
                        
                        if (params.dataIndex === 1) { 
                            // --- 温度逻辑 ---
                            if (val > 30) return '#f87171'; // >30度: 红
                            if (val > 26) return '#fbbf24'; // >26度: 黄
                            if (val < 15) return '#38bdf8'; // <15度: 蓝
                            return '#34d399';               // 舒适: 绿
                        } else {
                            // --- 湿度逻辑 ---
                            if (val > 70) return '#f87171'; // >70%: 湿热/红
                            if (val > 60) return '#fbbf24'; // >60%: 黄
                            if (val < 30) return '#fbbf24'; // <30%: 干燥/黄
                            return '#38bdf8';               // 正常: 蓝
                        }
                    }
                }
            }]
        });
    }

    function updateBar(data) {
        charts.bar.setOption({
            ...darkTheme,
            xAxis: { type: 'category', data: ['男', '女'], ...darkTheme.categoryAxis },
            yAxis: { type: 'value', ...darkTheme.valueAxis },
            series: [{
                type: 'bar', data: data, barWidth: '40%',
                itemStyle: { borderRadius:[4,4,0,0], color: (p)=>p.dataIndex===0?'#38bdf8':'#f472b6' }
            }]
        });
    }

    // --- 5. 初始化 ---
    window.onload = function() {
        initCharts();
        drawConnections();
        setTimeout(() => handleSelect('zhijin'), 300);

        setInterval(() => {
            const now = new Date();
            document.getElementById('clock').innerText = now.toLocaleString('zh-CN');
        }, 1000);

        window.addEventListener('resize', () => {
            Object.values(charts).forEach(c => c.resize());
            drawConnections();
        });
    };