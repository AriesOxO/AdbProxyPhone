const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取当前日期作为日志文件名
const logDir = path.join(__dirname, 'log');
const logFileName = `${new Date().toISOString().slice(0, 10)}.log`;
const logFilePath = path.join(logDir, logFileName);

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 记录日志到文件
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('写入日志文件时发生错误:', err);
    }
  });
}

// 存储电话号码及其状态的数组
let phoneNumbersList = [];
let selectedDevice = "";

// 初始化时检查设备连接情况
window.onload = () => {
  checkADBDevices();
};

// 刷新设备列表
document.getElementById('refreshDevices').addEventListener('click', () => {
  checkADBDevices();
});

// 检查 ADB 设备
function checkADBDevices() {
  logToFile("检测 ADB 设备...");
  exec(`adb devices`, (error, stdout, stderr) => {
    if (error) {
      logToFile(`ADB 错误: ${error}`);
      return;
    }

    const devices = parseDevices(stdout);
    const deviceList = document.getElementById('deviceList');
    deviceList.innerHTML = '';  // 清空下拉框

    if (devices.length > 0) {
      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device;
        option.textContent = device;
        deviceList.appendChild(option);
      });
      selectedDevice = devices[0];  // 默认选择第一个设备
      logToFile(`已连接设备: ${selectedDevice}`);
    } else {
      const option = document.createElement('option');
      option.textContent = "未检测到设备，请连接设备";
      option.value = "";
      deviceList.appendChild(option);
      logToFile('未检测到设备');
    }
  });
}

// 解析 adb devices 命令的输出
function parseDevices(output) {
  const lines = output.split('\n');
  const devices = [];
  lines.forEach(line => {
    if (line.includes('device') && !line.includes('List of devices')) {
      const deviceId = line.split('\t')[0];
      devices.push(deviceId);
    }
  });
  return devices;
}

// 拨打指定电话号码
function dialPhoneNumber(number, row) {
  if (!selectedDevice) {
    logToFile("请先选择一个设备");
    return;
  }

  const cmd = `adb -s ${selectedDevice} shell am start -a android.intent.action.CALL -d tel:${number}`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logToFile(`拨号失败: ${error}`);
      return;
    }

    logToFile(`拨打号码 ${number}: ${stdout}`);
    // 更新电话号码状态为 "已拨"
    const statusCell = row.cells[1];
    statusCell.textContent = '已拨';

    // 更新列表中的状态
    const phone = phoneNumbersList.find(item => item.number === number);
    if (phone) phone.status = '已拨';
  });
}

// 挂断电话
function hangupPhone(row) {
  if (!selectedDevice) {
    logToFile("请先选择一个设备");
    return;
  }

  const cmd = `adb -s ${selectedDevice} shell service call phone 3`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logToFile(`挂断失败: ${error}`);
      return;
    }

    logToFile(`挂断电话: ${stdout}`);
    // 更新电话号码状态为 "未拨"
    const statusCell = row.cells[1];
    statusCell.textContent = '未拨';
  });
}
