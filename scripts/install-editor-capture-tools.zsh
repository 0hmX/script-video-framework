#!/bin/zsh
set -euo pipefail

root=${0:A:h:h}
cd "$root"

[[ "$(uname -s)" == Darwin && "$(uname -m)" == arm64 ]] || {
  print -u2 'The pinned editor-capture installer currently supports macOS arm64.'
  exit 1
}

for command in curl git shasum tar make cc pkg-config; do
  command -v "$command" >/dev/null || { print -u2 "Missing build prerequisite: $command"; exit 1; }
done

openssl_prefix=${OPENSSL_PREFIX:-/opt/homebrew/opt/openssl@3}
jsonc_prefix=${JSONC_PREFIX:-/opt/homebrew/opt/json-c}
[[ -d "$openssl_prefix" && -d "$jsonc_prefix" ]] || {
  print -u2 'OpenSSL 3 and json-c headers are required (set OPENSSL_PREFIX and JSONC_PREFIX).'
  exit 1
}

mkdir -p .tools/bin .tools/downloads .tools/runtime .tools/source .tools/build

download_verified() {
  local url=$1 destination=$2 checksum=$3
  if [[ ! -f "$destination" ]]; then
    curl --retry 3 --connect-timeout 15 -fL "$url" -o "$destination"
  fi
  print "$checksum  $destination" | shasum -a 256 -c -
}

download_verified \
  https://github.com/neovim/neovim/releases/download/v0.12.5/nvim-macos-arm64.tar.gz \
  .tools/downloads/nvim-macos-arm64.tar.gz \
  65fb000099e47ca1b762584c484cc833f40e30851a0ec450d4174e16317c1f9b
[[ -x .tools/runtime/nvim-macos-arm64/bin/nvim ]] || tar -xzf .tools/downloads/nvim-macos-arm64.tar.gz -C .tools/runtime
ln -sfn ../runtime/nvim-macos-arm64/bin/nvim .tools/bin/nvim

download_verified \
  https://github.com/charmbracelet/vhs/releases/download/v0.11.0/vhs_0.11.0_Darwin_arm64.tar.gz \
  .tools/downloads/vhs-Darwin-arm64.tar.gz \
  eec91ee450ba50b6d4fce2800593b2ac5fdd88a73056367d2c3b870ee44de3f7
if [[ ! -x .tools/bin/vhs ]]; then
  mkdir -p .tools/downloads/vhs
  tar -xzf .tools/downloads/vhs-Darwin-arm64.tar.gz -C .tools/downloads/vhs
  cp "$(find .tools/downloads/vhs -type f -name vhs -perm -111 -print -quit)" .tools/bin/vhs
fi

download_verified \
  https://github.com/Kitware/CMake/releases/download/v4.4.3/cmake-4.4.3-macos-universal.tar.gz \
  .tools/downloads/cmake-macos-universal.tar.gz \
  0c5d65251c14cc884bfa16bdbed3c263ce5bffe2e21c0d0d00962cb0610464fa
[[ -x .tools/runtime/cmake-4.4.3-macos-universal/CMake.app/Contents/bin/cmake ]] || tar -xzf .tools/downloads/cmake-macos-universal.tar.gz -C .tools/runtime
ln -sfn ../runtime/cmake-4.4.3-macos-universal/CMake.app/Contents/bin/cmake .tools/bin/cmake

clone_pinned() {
  local repository=$1 tag=$2 commit=$3 destination=$4
  if [[ ! -d "$destination/.git" ]]; then
    git clone --filter=blob:none --branch "$tag" --depth 1 "$repository" "$destination"
  fi
  [[ "$(git -C "$destination" rev-parse HEAD)" == "$commit" ]] || {
    print -u2 "Unexpected commit in $destination"
    exit 1
  }
}

clone_pinned https://github.com/libuv/libuv.git v1.52.1 1cfa32ff59c076ffb6ed735bbc8c18361558661f .tools/source/libuv
.tools/bin/cmake -S .tools/source/libuv -B .tools/build/libuv \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$root/.tools/runtime/libuv" \
  -DLIBUV_BUILD_TESTS=OFF -DLIBUV_BUILD_BENCH=OFF
.tools/bin/cmake --build .tools/build/libuv --parallel
.tools/bin/cmake --install .tools/build/libuv

clone_pinned https://github.com/warmcat/libwebsockets.git v4.5.8 fbb0baf6af9c4324f0f1591734c78b0089b599d4 .tools/source/libwebsockets
.tools/bin/cmake -S .tools/source/libwebsockets -B .tools/build/libwebsockets \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$root/.tools/runtime/libwebsockets" \
  -DCMAKE_PREFIX_PATH="$root/.tools/runtime/libuv;$openssl_prefix" \
  -DOPENSSL_ROOT_DIR="$openssl_prefix" -DLWS_WITH_LIBUV=ON \
  -DLWS_WITHOUT_TESTAPPS=ON -DLWS_WITHOUT_TEST_SERVER=ON \
  -DLWS_WITHOUT_TEST_SERVER_EXTPOLL=ON -DLWS_WITHOUT_TEST_PING=ON \
  -DLWS_WITHOUT_TEST_CLIENT=ON -DLWS_WITH_SHARED=ON -DLWS_WITH_STATIC=OFF
.tools/bin/cmake --build .tools/build/libwebsockets --parallel
.tools/bin/cmake --install .tools/build/libwebsockets

clone_pinned https://github.com/tsl0922/ttyd.git 1.7.7 40e79c706be14029b391f369bee6613c31667abb .tools/source/ttyd
capture_prefix="$root/.tools/runtime/libuv;$root/.tools/runtime/libwebsockets;$openssl_prefix"
capture_libs="-L$root/.tools/runtime/libwebsockets/lib -L$root/.tools/runtime/libuv/lib -L$openssl_prefix/lib -L$jsonc_prefix/lib"
PKG_CONFIG_PATH="$root/.tools/runtime/libuv/lib/pkgconfig:$root/.tools/runtime/libwebsockets/lib/pkgconfig:$jsonc_prefix/lib/pkgconfig:$openssl_prefix/lib/pkgconfig" \
  .tools/bin/cmake -S .tools/source/ttyd -B .tools/build/ttyd \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$root/.tools/runtime/ttyd" \
  -DCMAKE_PREFIX_PATH="$capture_prefix" -DOPENSSL_ROOT_DIR="$openssl_prefix" \
  -DCMAKE_EXE_LINKER_FLAGS="$capture_libs"
LDFLAGS="$capture_libs" .tools/bin/cmake --build .tools/build/ttyd --parallel
.tools/bin/cmake --install .tools/build/ttyd

{
  print '#!/bin/zsh'
  print 'set -euo pipefail'
  print 'tool_root=${0:A:h:h}'
  print 'if [[ "${1:-}" == "--version" ]]; then print "ttyd version 1.7.7"; exit 0; fi'
  print 'export DYLD_LIBRARY_PATH="$tool_root/runtime/libwebsockets/lib:$tool_root/runtime/libuv/lib${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"'
  print 'exec "$tool_root/runtime/ttyd/bin/ttyd" "$@"'
} > .tools/bin/ttyd
chmod +x .tools/bin/ttyd

PATH="$root/.tools/bin:$PATH" ttyd --version
.tools/bin/nvim --version | head -n 1
.tools/bin/vhs --version
print 'Project-local VHS and Neovim capture tools are ready.'
