#!/usr/bin/env python3
"""
=============================================================================
  SISTEM PENDUKUNG KEPUTUSAN SELEKSI PENERIMAAN BANTUAN PIP
  Runner Script Otomatis (Cross-Platform: Windows, macOS, Linux)
  
  Fungsi:
  1. Memeriksa ketersediaan Node.js dan npm di sistem.
  2. Memeriksa dan menginstal node_modules (backend & frontend) bila belum ada
     atau jika opsi --install diberikan.
  3. Menjalankan server Backend (Node.js Express - Port 5001).
  4. Memeriksa ketersediaan koneksi API Backend (Health-Check).
  5. Menjalankan server Frontend (React + Vite - Port 5174).
  6. Memeriksa ketersediaan antarmuka Frontend (Health-Check).
  7. Membuka otomatis aplikasi di web browser pengguna.
  8. Memantau kesehatan proses dan menangani penutupan bersih (Ctrl+C).
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

BACKEND_PORT = 5001
FRONTEND_PORT = 5174

backend_proc = None
frontend_proc = None
is_cleaning_up = False

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

def should_reinstall(folder_path):
    """Cek apakah node_modules perlu di-install ulang berdasarkan perubahan package.json."""
    modules_dir = os.path.join(folder_path, "node_modules")
    pkg_file = os.path.join(folder_path, "package.json")
    if not os.path.exists(modules_dir):
        return True
    if os.path.exists(pkg_file):
        pkg_mtime = os.path.getmtime(pkg_file)
        modules_mtime = os.path.getmtime(modules_dir)
        if pkg_mtime > modules_mtime:
            return True
    return False

def ensure_dependencies(force=False):
    """Memeriksa dan memasang dependensi backend dan frontend."""
    print(f"{BOLD}[2/5] Memeriksa Modul Dependensi (node_modules)...{RESET}")
    npm_cmd = get_npm_cmd()

    # Backend
    if force or should_reinstall(BACKEND_DIR):
        print(f"  {YELLOW}Memasang dependensi backend (npm install)...{RESET}")
        subprocess.run([npm_cmd, "install"], cwd=BACKEND_DIR, check=True)
        print(f"  {GREEN}✔ Modul backend berhasil dipasang.{RESET}")
    else:
        print(f"  {GREEN}✔{RESET} Modul Backend : Terpasang")

    # Frontend
    if force or should_reinstall(FRONTEND_DIR):
        print(f"  {YELLOW}Memasang dependensi frontend (npm install)...{RESET}")
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)
        print(f"  {GREEN}✔ Modul frontend berhasil dipasang.{RESET}")
    else:
        print(f"  {GREEN}✔{RESET} Modul Frontend: Terpasang")
    print()

def start_backend():
    """Menjalankan server backend Express."""
    global backend_proc
    print(f"{BOLD}[3/5] Menjalankan Server Backend (Node.js Express)...{RESET}")
    node_cmd = get_node_cmd()

    kwargs = {}
    if platform.system() == "Windows":
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs['preexec_fn'] = os.setsid

    env = os.environ.copy()
    env["PORT"] = str(BACKEND_PORT)

    # Avoid buffer deadlock: do not capture stderr into unconsumed pipe
    backend_proc = subprocess.Popen(
        [node_cmd, "server.js"],
        cwd=BACKEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=None,
        env=env,
        **kwargs
    )

    # Health check loop
    url = f"http://localhost:{BACKEND_PORT}/api/health"
    max_retries = 25
    is_ready = False

    for attempt in range(max_retries):
        if backend_proc.poll() is not None:
            print(f"  {RED}[ERROR] Server Backend berhenti lebih awal (exit code: {backend_proc.returncode}).{RESET}")
            print(f"  Periksa apakah Port {BACKEND_PORT} sudah digunakan oleh aplikasi lain.")
            cleanup()
            sys.exit(1)

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
        print(f"  {RED}[ERROR] Backend tidak merespons setelah {max_retries * 0.5:.1f} detik.{RESET}")
        cleanup()
        sys.exit(1)
    print()

def start_frontend():
    """Menjalankan server frontend Vite."""
    global frontend_proc
    print(f"{BOLD}[4/5] Menjalankan Antarmuka Frontend (Vite + React)...{RESET}")
    npm_cmd = get_npm_cmd()

    kwargs = {}
    if platform.system() == "Windows":
        kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs['preexec_fn'] = os.setsid

    # Avoid buffer deadlock
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=None,
        **kwargs
    )

    # Health check on strict port 5174
    test_url = f"http://localhost:{FRONTEND_PORT}/"
    max_retries = 30
    is_ready = False

    for attempt in range(max_retries):
        if frontend_proc.poll() is not None:
            print(f"  {RED}[ERROR] Server Frontend berhenti lebih awal (exit code: {frontend_proc.returncode}).{RESET}")
            cleanup()
            sys.exit(1)

        try:
            req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=1.2) as response:
                if response.status == 200:
                    is_ready = True
                    break
        except Exception:
            pass
        time.sleep(0.5)

    if is_ready:
        print(f"  {GREEN}✔ Frontend Aktif & Terverifikasi{RESET}: {test_url}")
    else:
        print(f"  {RED}[ERROR] Frontend tidak merespons di {test_url} setelah {max_retries * 0.5:.1f} detik.{RESET}")
        cleanup()
        sys.exit(1)

    print()
    return test_url

def kill_process(p):
    """Membunuh proses beserta seluruh tree anaknya."""
    if p is None or p.poll() is not None:
        return
    try:
        if platform.system() == "Windows":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            os.killpg(os.getpgid(p.pid), signal.SIGTERM)
    except Exception:
        try:
            p.terminate()
        except Exception:
            pass

def cleanup(sig=None, frame=None):
    """Menghentikan semua subproses secara bersih."""
    global is_cleaning_up
    if is_cleaning_up:
        return
    is_cleaning_up = True

    print(f"\n\n{YELLOW}Menutup seluruh layanan sistem PIP...{RESET}")
    kill_process(backend_proc)
    kill_process(frontend_proc)
    print(f"{GREEN}Semua server telah dihentikan dengan aman. Sampai jumpa!{RESET}\n")
    sys.exit(0)

def main():
    force_install = "--install" in sys.argv

    # Register Ctrl+C & termination signals
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print_banner()
    check_prerequisites()
    ensure_dependencies(force=force_install)
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
    print(f"  - Informasi Akun     : Lihat file README.md (Bagian 6. Akun Login Sistem)")
    print(f"{GREEN}{BOLD}====================================================================={RESET}")
    print(f"\n{YELLOW}Tekan {BOLD}Ctrl + C{RESET}{YELLOW} di jendela terminal ini kapan saja untuk menghentikan sistem.{RESET}\n")

    # Monitor process health continuously
    try:
        while True:
            if backend_proc and backend_proc.poll() is not None:
                print(f"\n{RED}[PERINGATAN] Server Backend berhenti secara tidak terduga (exit code: {backend_proc.returncode}).{RESET}")
                cleanup()
            if frontend_proc and frontend_proc.poll() is not None:
                print(f"\n{RED}[PERINGATAN] Server Frontend berhenti secara tidak terduga (exit code: {frontend_proc.returncode}).{RESET}")
                cleanup()
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
