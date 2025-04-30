// 用户行为数据管理
class UserBehaviorManager {
  constructor() {
    this.userId = this.getUserId();
    this.visitsChart = null;
    this.clickDistributionChart = null;
    this.setupEventListeners();
    this.loadData();
  }

  // 从localStorage获取用户ID
  getUserId() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.id) {
          return user.id;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    console.warn('No user ID found. Please login first.');
    return null;
  }

  // 设置事件监听器
  setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());
    document.getElementById('analyzeBtn').addEventListener('click', () => this.showAnalysisResults());
  }

  // 加载用户行为数据
  async loadData() {
    if (!this.userId) {
      alert('请先登录以查看用户行为数据');
      return;
    }

    try {
      // 获取页面指标
      const pageMetricsResponse = await fetch('/api/behavior/page-metrics');
      if (!pageMetricsResponse.ok) {
        throw new Error(`获取页面指标失败: ${pageMetricsResponse.status}`);
      }
      const pageMetrics = await pageMetricsResponse.json();
      
      // 获取用户指标
      const userMetricsResponse = await fetch(`/api/behavior/user-metrics/${this.userId}`);
      if (!userMetricsResponse.ok) {
        throw new Error(`获取用户指标失败: ${userMetricsResponse.status}`);
      }
      const userMetrics = await userMetricsResponse.json();
      
      // 获取历史数据
      const historyResponse = await fetch(`/api/behavior/history/${this.userId}`);
      if (!historyResponse.ok) {
        throw new Error(`获取历史数据失败: ${historyResponse.status}`);
      }
      const historyData = await historyResponse.json();

      this.updateDataCards(pageMetrics, userMetrics);
      this.updateDetailedTable(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('加载数据失败，请稍后重试');
    }
  }

  // 更新数据卡片
  updateDataCards(pageMetrics, userMetrics) {
    // 更新页面浏览数据
    document.getElementById('totalVisits').textContent = pageMetrics.totalVisits || 0;
    document.getElementById('avgDuration').textContent = this.formatDuration(pageMetrics.avgDuration || 0);
    document.getElementById('bounceRate').textContent = `${(pageMetrics.bounceRate || 0).toFixed(1)}%`;

    // 更新用户点击行为
    document.getElementById('totalClicks').textContent = userMetrics.totalClicks || 0;
    document.getElementById('totalDuration').textContent = this.formatDuration(userMetrics.totalDuration || 0);
    document.getElementById('mostClickedArea').textContent = userMetrics.mostClickedArea || '无数据';
    document.getElementById('mostBrowsedArea').textContent = userMetrics.mostBrowsedArea || '无数据';
    document.getElementById('conversionRate').textContent = `${(userMetrics.conversionRate || 0).toFixed(1)}%`;
  }

  formatDuration(seconds) {
    if (!seconds) return '0分钟';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  }

  // 更新详细数据表格
  updateDetailedTable(historyData) {
    const tbody = document.querySelector('#detailedTable tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(historyData)) {
      console.error('历史数据格式错误:', historyData);
      return;
    }

    historyData.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.page || '-'}</td>
        <td>${this.formatDuration(record.duration || 0)}</td>
        <td>${record.clicks || 0}</td>
        <td>${new Date(record.timestamp).toLocaleString()}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // 显示分析结果
  showAnalysisResults() {
    const analysisResults = document.getElementById('analysisResults');
    analysisResults.style.display = 'block';
    
    this.createVisitsChart();
    this.createClickDistributionChart();
  }

  // 创建访问量图表
  createVisitsChart() {
    const ctx = document.getElementById('visitsChart').getContext('2d');
    
    // 销毁现有图表
    if (this.visitsChart) {
      this.visitsChart.destroy();
    }
    
    this.visitsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [{
          label: '访问量',
          data: [12, 19, 3, 5, 2, 3, 7],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // 创建点击分布图表
  createClickDistributionChart() {
    const ctx = document.getElementById('clickDistributionChart').getContext('2d');
    
    // 销毁现有图表
    if (this.clickDistributionChart) {
      this.clickDistributionChart.destroy();
    }
    
    this.clickDistributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['商品详情', '购物车', '结算', '其他'],
        datasets: [{
          data: [30, 20, 15, 35],
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)'
          ]
        }]
      },
      options: {
        responsive: true
      }
    });
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new UserBehaviorManager();
}); 