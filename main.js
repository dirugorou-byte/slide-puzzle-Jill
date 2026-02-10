"use strict";

const { createApp } = Vue;

// 自動再生制限対策
function safePlay(audio) {
  if (!audio) return;
  const p = audio.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

createApp({
  data() {
    // ★初期描画でundefined参照が起きないよう、最初から16個作る
    const tiles = [];
    for (let i = 0; i < 16; i++) {
      const isEmpty = i === 15;
      const row = Math.floor(i / 4);
      const col = i % 4;
      tiles.push({
        value: isEmpty ? 0 : i + 1,
        bgPos: `-${col * 70}px -${row * 70}px`,
      });
    }

    return {
      tiles,
      status: "",
      solvedOnce: false,
      bgmAudio: null,
      exitoAudio: null,
    };
  },

  mounted() {
    // 音声DOM
    this.bgmAudio = document.getElementById("bgm");
    this.exitoAudio = document.getElementById("exito");

    if (this.bgmAudio) {
      this.bgmAudio.loop = true;
      this.bgmAudio.currentTime = 0;
      this.bgmAudio.pause();
    }

    // 成功音は1回で止める
    if (this.exitoAudio) {
      this.exitoAudio.loop = false;
      this.exitoAudio.currentTime = 0;
      this.exitoAudio.pause();
    }

    // 念のため初期化（すでに16個あるが、状態を揃える）
    this.initBoard();
  },

  methods: {
    initBoard() {
      for (let index = 0; index < 16; index++) {
        const isEmpty = index === 15;
        const row = Math.floor(index / 4);
        const col = index % 4;

        this.tiles[index].value = isEmpty ? 0 : index + 1;
        this.tiles[index].bgPos = `-${col * 70}px -${row * 70}px`;
      }

      this.status = "";
      this.solvedOnce = false;

      // 音も初期化
      if (this.bgmAudio) {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      }
      if (this.exitoAudio) {
        this.exitoAudio.pause();
        this.exitoAudio.currentTime = 0;
      }
    },

    clickTile(i) {
      // タイル押下でBGM再生を試す（Safari等の救済）
      if (this.bgmAudio) safePlay(this.bgmAudio);

      // 空白と隣接しているならswap
      if (i - 4 >= 0 && this.tiles[i - 4].value === 0) this.swap(i, i - 4);
      else if (i + 4 < 16 && this.tiles[i + 4].value === 0) this.swap(i, i + 4);
      else if (i % 4 !== 0 && this.tiles[i - 1].value === 0) this.swap(i, i - 1);
      else if (i % 4 !== 3 && this.tiles[i + 1].value === 0) this.swap(i, i + 1);

      if (this.isSolved()) {
        this.status = "Solved! ジルちゃん完成！";

        if (!this.solvedOnce) {
          this.solvedOnce = true;

          // 完成でBGM停止
          if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
          }

          // 成功音を1回だけ
          if (this.exitoAudio) {
            this.exitoAudio.pause();
            this.exitoAudio.currentTime = 0;
            safePlay(this.exitoAudio);
          }
        }
      } else {
        this.status = "";
      }
    },

    swap(i, j) {
      const tmpV = this.tiles[i].value;
      this.tiles[i].value = this.tiles[j].value;
      this.tiles[j].value = tmpV;

      const tmpP = this.tiles[i].bgPos;
      this.tiles[i].bgPos = this.tiles[j].bgPos;
      this.tiles[j].bgPos = tmpP;
    },

    shuffle() {
      // シャッフル開始は確実にユーザー操作なのでBGMを鳴らす
      if (this.bgmAudio) safePlay(this.bgmAudio);

      // 成功音リセット
      if (this.exitoAudio) {
        this.exitoAudio.pause();
        this.exitoAudio.currentTime = 0;
      }

      this.solvedOnce = false;

      // 「空白の隣を動かす」方式なので必ず解ける並びになる
      const steps = 200;
      for (let k = 0; k < steps; k++) {
        const emptyIndex = this.tiles.findIndex((t) => t.value === 0);
        const candidates = [];

        if (emptyIndex - 4 >= 0) candidates.push(emptyIndex - 4);
        if (emptyIndex + 4 < 16) candidates.push(emptyIndex + 4);
        if (emptyIndex % 4 !== 0) candidates.push(emptyIndex - 1);
        if (emptyIndex % 4 !== 3) candidates.push(emptyIndex + 1);

        const moveFrom = candidates[Math.floor(Math.random() * candidates.length)];
        this.swap(moveFrom, emptyIndex);
      }

      this.status = "";
    },

    isSolved() {
      for (let i = 0; i < 16; i++) {
        const expected = i === 15 ? 0 : i + 1;
        if (this.tiles[i].value !== expected) return false;
      }
      return true;
    },

    tileStyle(t) {
      // ★undefined安全
      if (!t) return {};
      return { backgroundPosition: t.bgPos };
    },

    tileClass(t) {
      // ★undefined安全
      const isEmpty = !t || t.value === 0;
      return ["tile", { empty: isEmpty }];
    },

    tileText(t) {
      // ★undefined安全（文字はCSSで隠すがDOMは持たせる）
      if (!t || t.value === 0) return "";
      return String(t.value);
    },
  },
}).mount("#app");
