const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    dialog
} = require('electron');
const {
    proccess,
    stopProccess
} = require("./index2");
const fs = require('fs');

let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 480,
        height: 768,
        x: 0,
        y: 0,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0d6efd',
            symbolColor: '#fff'
        },
        icon: "./assets/logo.png",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: !app.isPackaged
        }
    });
    !app.isPackaged && mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('start', async (event, list, headless) => {
    const logs = [];
    const reports = [];
    const prog = [];

    const logToTextarea = (message) => {
        logs.push(message);
        event.sender.send('log', logs.join('\n'));
    };

    const logToTable = (search, hasil) => {
        reports.push({
            search,
            hasil
        });
        event.sender.send('logToTable', reports);
    }

    const proggress = (pros) => {
        prog.push(pros);
        event.sender.send('proggress', prog);
    };

    try {
        logToTextarea('[INFO] Process started...');
        event.sender.send("run");
        await proccess(logToTextarea, logToTable, proggress, list, headless);
        logToTextarea('[INFO] Process completed successfully.');
        event.sender.send("force");
    } catch (error) {
        event.sender.send("force");
        logToTextarea('[ERROR] ' + error.message);
    }
});

ipcMain.on('stop', (event) => {
    const logs = [];

    const logToTextarea = (message) => {
        logs.push(message);
        event.sender.send('log', logs.join('\n'));
    };

    event.sender.send("force");
    stopProccess(logToTextarea);
});

ipcMain.on('save-excel-data', (event, data) => {
    const options = {
        title: 'Save an Excel',
        filters: [{
            name: 'Excel',
            extensions: ['xlsx']
        }]
    };

    dialog.showSaveDialog(options).then(result => {
        if (!result.canceled) {
            fs.writeFileSync(result.filePath, new Uint8Array(data));
            dialog.showMessageBox({
                type: 'info',
                title: 'Alert',
                message: 'Success save the file report',
                buttons: ['OK']
            });
        } else {
            dialog.showMessageBox({
                type: 'info',
                title: 'Alert',
                message: 'File save cancelled',
                buttons: ['OK']
            });
        }
    }).catch(err => {
        console.error(err);
        dialog.showMessageBox({
            type: 'error',
            title: 'Error',
            message: 'An error occurred while saving the file.',
            buttons: ['OK']
        });
    });
});
