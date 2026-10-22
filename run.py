#!/usr/bin/env python3
"""
=============================================================================
  SISTEM PENDUKUNG KEPUTUSAN SELEKSI PENERIMAAN BANTUAN PIP
  Runner Script Otomatis (Cross-Platform: Windows, macOS, Linux)
  
  Fungsi:
  1. Memeriksa ketersediaan Node.js dan npm di sistem.
  2. Memeriksa dan menginstal node_modules (backend & frontend) bila belum ada.
  3. Menjalankan server Backend (Node.js Express - Port 5000).
  4. Memeriksa ketersediaan koneksi API Backend (Health-Check).
  5. Menjalankan server Frontend (React + Vite).
  6. Memeriksa ketersediaan antarmuka Frontend (Health-Check).
  7. Membuka otomatis aplikasi di web browser pengguna.
  8. Menangani penghentian proses (Ctrl+C) secara bersih tanpa port terkunci.
=============================================================================
"""

import os
import sys
import time
import shutil
import signal
import platform
import subprocess
import urllib.request
import urllib.error
import webbrowser

# ANSI Colors for Terminal
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

# Windows ANSI Color activation
if platform.system() == "Windows":
    os.system('')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

BACKEND_PORT = 5000
FRONTEND_PORTS = [5174, 5173, 3000]

processes = []

def print_banner():
    print(f"\n{CYAN}{BOLD}====================================================================={RESET}")
    print(f"{CYAN}{BOLD}   SISTEM PENDUKUNG KEPUTUSAN SELEKSI BANTUAN PIP                    {RESET}")
    print(f"{CYAN}   Metode: Multi-Expert Best-Worst Method (BWM) + WASPAS             {RESET}")
    print(f"{CYAN}   SMKS Dharma Bhakti Walter Manalu Siborongborong                   {RESET}")
    print(f"{CYAN}{BOLD}====================================================================={RESET}\n")

def get_npm_cmd():
    """Mengembalikan perintah npm yang sesuai dengan OS."""
    if platform.system() == "Windows":
        return "npm.cmd" if shutil.which("npm.cmd") else "npm"
    return "npm"

def get_node_cmd():
    """Mengembalikan perintah node yang sesuai dengan OS."""
    if platform.system() == "Windows":
        return "node.exe" if shutil.which("node.exe") else "node"
    return "node"

def check_prerequisites():
    """Memeriksa Node.js dan npm."""
    print(f"{BOLD}[1/5] Memeriksa Lingkungan Sistem...{RESET}")
    
    node_cmd = get_node_cmd()
    npm_cmd = get_npm_cmd()
    
    if not shutil.which(node_cmd):
        print(f"{RED}[ERROR] Node.js tidak ditemukan di sistem!{RESET}")
        print("Silakan unduh dan pasang Node.js dari: https://nodejs.org/")
        sys.exit(1)
        
    if not shutil.which(npm_cmd):
        print(f"{RED}[ERROR] npm tidak ditemukan di sistem!{RESET}")
        sys.exit(1)
        
    node_ver = subprocess.check_output([node_cmd, "--version"], text=True).strip()
    npm_ver = subprocess.check_output([npm_cmd, "--version"], text=True).strip()
    
    print(f"  {GREEN}✔{RESET} Sistem Operasi: {platform.system()} ({platform.machine()})")
    print(f"  {GREEN}✔{RESET} Node.js Versi : {node_ver}")
    print(f"  {GREEN}✔{RESET} npm Versi     : {npm_ver}")
    print()

def ensure_dependencies():
    """Memeriksa dan memasang dependensi backend dan frontend jika belum ada."""
    print(f"{BOLD}[2/5] Memeriksa Modul Dependensi (node_modules)...{RESET}")
    npm_cmd = get_npm_cmd()

    # Backend node_modules check
    backend_modules = os.path.join(BACKEND_DIR, "node_modules")
    if not os.path.exists(backend_modules):
        print(f"  {YELLOW}⚠ Modul backend belum terpasang. Menjalankan 'npm install' di folder backend...{RESET}")
        subprocess.run([npm_cmd, "install"], cwd=BACKEND_DIR, check=True)
        print(f"  {GREEN}✔ Modul backend berhasil dipasang.{RESET}")
    else:
        print(f"  {GREEN}✔{RESET} Modul Backend : Terpasang")

    # Frontend node_modules check
    frontend_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.exists(frontend_modules):
        print(f"  {YELLOW}⚠ Modul frontend belum terpasang. Menjalankan 'npm install' di folder frontend...{RESET}")
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)
        print(f"  {GREEN}✔ Modul frontend berhasil dipasang.{RESET}")
    else:
        print(f"  {GREEN}✔{RESET} Modul Frontend: Terpasang")
    print()

def start_backend():
    """Menjalankan server backend Express."""
    print(f"{BOLD}[3/5] Menjalankan Server Backend (Node.js Express)...{RESET}")
    node_cmd = get_node_cmd()

    # Create sub-process
    kwargs = {}
    if platform.system() == "Windows":
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs['preexec_fn'] = os.setsid

    p = subprocess.Popen(
        [node_cmd, "server.js"],
        cwd=BACKEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        **kwargs
    )
    processes.append(p)

    # Health check loop
    url = f"http://localhost:{BACKEND_PORT}/api/health"
    max_retries = 20
    is_ready = False

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=1.5) as response:
                if response.status == 200:
                    is_ready = True
                    break
        except (urllib.error.URLError, urllib.error.HTTPError, ConnectionError, TimeoutError):
            pass
        time.sleep(0.5)

    if is_ready:
        print(f"  {GREEN}✔ Backend Aktif & Terverifikasi{RESET} : http://localhost:{BACKEND_PORT}/api")
    else:
        print(f"  {YELLOW}⚠ Backend telah dimulai pada port {BACKEND_PORT}. Melanjutkan...{RESET}")
    print()

def start_frontend():
    """Menjalankan server frontend Vite."""
    print(f"{BOLD}[4/5] Menjalankan Antarmuka Frontend (Vite + React)...{RESET}")
    npm_cmd = get_npm_cmd()

    kwargs = {}
    if platform.system() == "Windows":
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs['preexec_fn'] = os.setsid

    p = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        **kwargs
    )
    processes.append(p)

    # Health check to detect which port Vite is running on
    max_retries = 25
    active_frontend_url = None

    for attempt in range(max_retries):
        for port in FRONTEND_PORTS:
            test_url = f"http://localhost:{port}/"
            try:
                req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=1.0) as response:
                    if response.status == 200:
                        active_frontend_url = test_url
                        break
            except Exception:
                pass
        if active_frontend_url:
            break
        time.sleep(0.4)

    if not active_frontend_url:
        active_frontend_url = "http://localhost:5174/"

    print(f"  {GREEN}✔ Frontend Aktif & Terverifikasi{RESET}: {active_frontend_url}")
    print()
    return active_frontend_url

def cleanup(sig=None, frame=None):
    """Menghentikan semua subproses secara bersih."""
    print(f"\n\n{YELLOW}Menutup seluruh layanan sistem PIP...{RESET}")
    for p in processes:
        try:
            if platform.system() == "Windows":
                # Windows taskkill forcefully kills the process tree
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                # Unix kill process group
                os.killpg(os.getpgid(p.pid), signal.SIGTERM)
        except Exception:
            try:
                p.terminate()
            except Exception:
                pass
    print(f"{GREEN}Semua server telah dihentikan dengan aman. Sampai jumpa!{RESET}\n")
    sys.exit(0)

def main():
    # Register Ctrl+C & termination signals
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print_banner()
    check_prerequisites()
    ensure_dependencies()
    start_backend()
    frontend_url = start_frontend()

    print(f"{BOLD}[5/5] Membuka Antarmuka Aplikasi di Browser...{RESET}")
    try:
        webbrowser.open(frontend_url)
        print(f"  {GREEN}✔ Browser berhasil diluncurkan.{RESET}\n")
    except Exception as e:
        print(f"  {YELLOW}Silakan buka browser Anda secara manual ke: {frontend_url}{RESET}\n")

    print(f"{GREEN}{BOLD}====================================================================={RESET}")
    print(f"{GREEN}{BOLD}  SISTEM SPK PIP TELAH AKTIF & BERJALAN DENGAN SEMPURNA!             {RESET}")
    print(f"  - Antarmuka Frontend : {BOLD}{frontend_url}{RESET}")
    print(f"  - REST API Backend   : {BOLD}http://localhost:{BACKEND_PORT}/api{RESET}")
    print(f"  - Akun Demo Operator : {BOLD}operator{RESET} / sandi: {BOLD}pip2026{RESET}")
    print(f"  - Akun Kepsek/Pakar  : {BOLD}kepsek{RESET}   / sandi: {BOLD}kepsek2026{RESET}")
    print(f"{GREEN}{BOLD}====================================================================={RESET}")
    print(f"\n{YELLOW}Tekan {BOLD}Ctrl + C{RESET}{YELLOW} di jendela terminal ini kapan saja untuk menghentikan sistem.{RESET}\n")

    # Keep script alive
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
