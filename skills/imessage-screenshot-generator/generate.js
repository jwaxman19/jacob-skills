#!/usr/bin/env node
/**
 * iMessage Screenshot Generator
 * Generates a realistic iPhone Messages screenshot from a JSON config.
 *
 * Usage:
 *   node generate.js --config conversation.json --output screenshot.png
 *   node generate.js --config conversation.json --output screenshot.png --html-output debug.html
 *
 * Requires Chrome/Chromium installed on the system. Common paths are detected
 * automatically. If none found, install via: npx playwright install chromium
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// ─── Utilities ────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getInitials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function diffMinutes(a, b) {
  return Math.abs(new Date(a) - new Date(b)) / 60000;
}

function formatTimestamp(date, timeFormat) {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = timeFormat === '24h'
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (msgDay.getTime() === today.getTime()) return `Today ${timeStr}`;
  if (msgDay.getTime() === yesterday.getTime()) return `Yesterday ${timeStr}`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
}

// ─── SVG icons (iOS status bar) ───────────────────────────────────────────────

// Signal: 4 bars left(short)→right(tall). active = how many bars are solid.
// Levels: full=4, strong=3, medium=2, low=1
function signalSVG(level) {
  const map = { full: 4, strong: 3, medium: 2, low: 1, none: 0 };
  const active = map[level] ?? 4;
  const dim = i => i > active ? ' fill-opacity="0.25"' : '';
  return `<svg viewBox="0 0 34 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:11px">
    <path d="M1.24023 21.4844H4.05273C4.79492 21.4844 5.29297 20.9668 5.29297 20.2148V14.6289C5.29297 13.877 4.79492 13.3691 4.05273 13.3691H1.24023C0.498047 13.3691 0 13.877 0 14.6289V20.2148C0 20.9668 0.498047 21.4844 1.24023 21.4844Z" fill="currentColor"${dim(1)}/>
    <path d="M10.5859 21.4844H13.3984C14.1406 21.4844 14.6387 20.9668 14.6387 20.2148V10.7324C14.6387 9.9707 14.1406 9.46289 13.3984 9.46289H10.5859C9.84375 9.46289 9.3457 9.9707 9.3457 10.7324V20.2148C9.3457 20.9668 9.84375 21.4844 10.5859 21.4844Z" fill="currentColor"${dim(2)}/>
    <path d="M19.9219 21.4844H22.7441C23.4766 21.4844 23.9746 20.9668 23.9746 20.2148V6.21094C23.9746 5.44922 23.4766 4.94141 22.7441 4.94141H19.9219C19.1797 4.94141 18.6816 5.44922 18.6816 6.21094V20.2148C18.6816 20.9668 19.1797 21.4844 19.9219 21.4844Z" fill="currentColor"${dim(3)}/>
    <path d="M29.2676 21.4844H32.0898C32.832 21.4844 33.3203 20.9668 33.3203 20.2148V1.26953C33.3203 0.507812 32.832 0 32.0898 0H29.2676C28.5254 0 28.0273 0.507812 28.0273 1.26953V20.2148C28.0273 20.9668 28.5254 21.4844 29.2676 21.4844Z" fill="currentColor"${dim(4)}/>
  </svg>`;
}

// WiFi: 3 arcs inner→outer. active = how many arcs are solid.
function wifiSVG(level) {
  const map = { full: 3, strong: 3, medium: 2, low: 1, none: 0 };
  const active = map[level] ?? 3;
  const dim = i => i > active ? ' fill-opacity="0.25"' : '';
  return `<svg viewBox="0 0 30 21" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:11px">
    <path d="M1.83534 8.68164C2.06971 8.90625 2.40174 8.90625 2.63612 8.66211C5.72205 5.39062 9.82362 3.65234 14.4135 3.65234C19.0228 3.65234 23.1537 5.39062 26.2103 8.67188C26.4349 8.89648 26.7572 8.88672 26.9916 8.65234L28.6713 6.97266C28.8861 6.75781 28.8764 6.49414 28.7103 6.2793C25.7611 2.65625 20.1849 0.00976562 14.4135 0.00976562C8.64198 0.00976562 3.05604 2.64648 0.116586 6.2793C-0.0494299 6.49414 -0.0396642 6.75781 0.155648 6.97266L1.83534 8.68164Z" fill="currentColor"${dim(3)}/>
    <path d="M7.0697 13.9453C7.32361 14.1895 7.63611 14.1602 7.89001 13.8965C9.41345 12.207 11.9037 11.0059 14.4135 11.0156C16.9428 11.0059 19.433 12.2363 20.9857 13.9258C21.2103 14.1797 21.5033 14.1699 21.7572 13.9355L23.6517 12.0508C23.8568 11.8652 23.8666 11.5918 23.6908 11.377C21.806 9.0625 18.2806 7.36328 14.4135 7.36328C10.5463 7.36328 7.03064 9.0625 5.13611 11.377C4.96033 11.5918 4.96033 11.8457 5.17517 12.0508L7.0697 13.9453Z" fill="currentColor"${dim(2)}/>
    <path d="M14.4136 20.8105C14.6675 20.8105 14.8921 20.6934 15.3706 20.2246L18.4175 17.3047C18.603 17.1289 18.6421 16.875 18.4761 16.6504C17.685 15.625 16.1323 14.7266 14.4136 14.7266C12.6557 14.7266 11.103 15.6543 10.312 16.709C10.185 16.9141 10.2339 17.1289 10.4194 17.3047L13.4565 20.2246C13.935 20.6836 14.1597 20.8105 14.4136 20.8105Z" fill="currentColor"${dim(1)}/>
  </svg>`;
}

// Battery: outline shell + inner fill rect. level controls fill width.
function batterySVG(level) {
  const map = { full: 1.0, strong: 0.75, medium: 0.5, low: 0.25, none: 0.05 };
  const pct = map[level] ?? 1.0;
  // Inner fill area: x=1.72, usable width=29.3, y=1.74, height=13.14
  const fillW = (29.3 * pct).toFixed(2);
  return `<svg viewBox="0 0 37 17" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:11px">
    <path d="M6.57227 16.6113H26.2207C28.457 16.6113 30.1562 16.377 31.3672 15.166C32.5684 13.9648 32.793 12.2852 32.793 10.0488V6.57227C32.793 4.33594 32.5684 2.65625 31.3672 1.44531C30.1465 0.244141 28.457 0 26.2207 0H6.50391C4.3457 0 2.64648 0.244141 1.43555 1.45508C0.224609 2.66602 0 4.3457 0 6.51367V10.0488C0 12.2852 0.214844 13.9648 1.42578 15.166C2.64648 16.377 4.33594 16.6113 6.57227 16.6113ZM6.23047 14.8828C4.81445 14.8828 3.4668 14.668 2.69531 13.8965C1.93359 13.1348 1.72852 11.8066 1.72852 10.3906V6.29883C1.72852 4.82422 1.93359 3.47656 2.69531 2.71484C3.45703 1.93359 4.82422 1.73828 6.28906 1.73828H26.5625C27.9785 1.73828 29.3262 1.95312 30.0977 2.71484C30.8594 3.48633 31.0645 4.81445 31.0645 6.23047V10.3906C31.0645 11.8066 30.8594 13.1348 30.0977 13.8965C29.3262 14.6777 27.9785 14.8828 26.5625 14.8828H6.23047ZM34.3457 11.4453C35.3125 11.3867 36.5918 10.1562 36.5918 8.31055C36.5918 6.46484 35.3125 5.23438 34.3457 5.17578V11.4453Z" fill="currentColor" fill-opacity="0.25"/>
    <rect x="1.72" y="1.74" width="${fillW}" height="13.14" rx="1.5" fill="currentColor"/>
  </svg>`;
}

const BACK_CHEVRON = `<svg viewBox="0 0 18 23" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:17px;height:17px;color:#007AFF">
  <path d="M0 11.3086C0 11.8506 0.195312 12.2998 0.644531 12.7393L10.2881 22.1191C10.625 22.4561 11.0352 22.6221 11.5137 22.6221C12.5 22.6221 13.2959 21.8311 13.2959 20.8545C13.2959 20.3613 13.0908 19.9219 12.7344 19.5605L4.17969 11.2988L12.7344 3.04688C13.1006 2.69043 13.2959 2.23633 13.2959 1.75781C13.2959 0.78125 12.5 0 11.5137 0C11.0303 0 10.625 0.161133 10.2881 0.498047L0.644531 9.87793C0.200195 10.3076 0.00488281 10.752 0 11.3086Z" fill="currentColor"/>
</svg>`;

const VIDEO_CALL = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:25px;height:25px;color:#007AFF">
  <path d="M4.82117 19H13.7202C15.798 19 17.0414 17.7908 17.0414 15.7129V8.27859C17.0414 6.20925 15.798 5 13.7202 5H4.82117C2.83699 5 1.5 6.20925 1.5 8.27859V15.7129C1.5 17.7908 2.74332 19 4.82117 19ZM5.05962 17.7141C3.66302 17.7141 2.87105 16.9903 2.87105 15.517V8.48296C2.87105 7.00121 3.66302 6.27737 5.05962 6.27737H13.4818C14.8699 6.27737 15.6703 7.00121 15.6703 8.48296V15.517C15.6703 16.9903 14.8699 17.7141 13.4818 17.7141H5.05962ZM16.8455 9.61557V11.2336L20.899 7.88686C20.9756 7.82725 21.0267 7.78467 21.1034 7.78467C21.2056 7.78467 21.2481 7.86983 21.2481 7.98904V16.011C21.2481 16.1302 21.2056 16.2068 21.1034 16.2068C21.0267 16.2068 20.9756 16.1642 20.899 16.1131L16.8455 12.7664V14.3759L20.2603 17.2713C20.6009 17.5523 20.9756 17.7481 21.3248 17.7481C22.0742 17.7481 22.5681 17.1947 22.5681 16.4027V7.59733C22.5681 6.80535 22.0742 6.25183 21.3248 6.25183C20.9756 6.25183 20.6009 6.44769 20.2603 6.72871L16.8455 9.61557Z" fill="currentColor"/>
</svg>`;

const NAME_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:9px;height:9px;flex-shrink:0">
  <path d="M16.535 11.7486C16.5295 11.3958 16.402 11.1014 16.1174 10.8254L9.48535 4.32854C9.25873 4.10782 8.99214 4 8.66634 4C8.02338 4 7.5 4.51201 7.5 5.15812C7.5 5.47528 7.63016 5.76971 7.8642 6.00414L13.7659 11.7459L7.8642 17.4931C7.6329 17.7248 7.5 18.016 7.5 18.3419C7.5 18.9852 8.02338 19.5 8.66634 19.5C8.98665 19.5 9.25873 19.3921 9.48535 19.1656L16.1174 12.6718C16.4048 12.39 16.535 12.0987 16.535 11.7486Z" fill="currentColor"/>
</svg>`;

const APP_BUTTON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px">
  <path d="M4 12.2616C4 12.9544 4.56808 13.5189 5.25732 13.5189H11.0074V19.269C11.0074 19.9551 11.5688 20.5232 12.2616 20.5232C12.9544 20.5232 13.5256 19.9551 13.5256 19.269V13.5189H19.269C19.9551 13.5189 20.5232 12.9544 20.5232 12.2616C20.5232 11.5688 19.9551 10.9976 19.269 10.9976H13.5256V5.25732C13.5256 4.56808 12.9544 4 12.2616 4C11.5688 4 11.0074 4.56808 11.0074 5.25732V10.9976H5.25732C4.56808 10.9976 4 11.5688 4 12.2616Z" fill="currentColor"/>
</svg>`;

const MICROPHONE = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;color:#ACB4B7;flex-shrink:0">
  <path d="M5 11.6945C5 15.4993 7.52124 18.0717 11.0854 18.4399V20.0892H7.87046C7.3483 20.0892 6.90515 20.5177 6.90515 21.0491C6.90515 21.5718 7.3483 22 7.87046 22H16.1267C16.6517 22 17.0948 21.5718 17.0948 21.0491C17.0948 20.5177 16.6517 20.0892 16.1267 20.0892H12.9146V18.4399C16.4848 18.0717 19 15.4993 19 11.6945V9.95811C19 9.42964 18.574 9.02132 18.0463 9.02132C17.5213 9.02132 17.0838 9.42964 17.0838 9.95811V11.6294C17.0838 14.6721 15.0013 16.6593 12.003 16.6593C8.99865 16.6593 6.91616 14.6721 6.91616 11.6294V9.95811C6.91616 9.42964 6.48465 9.02132 5.95086 9.02132C5.42309 9.02132 5 9.42964 5 9.95811V11.6945ZM12.003 14.8612C13.8096 14.8612 15.2081 13.4822 15.2081 11.4521V5.41195C15.2081 3.37859 13.8096 2 12.003 2C10.1876 2 8.78063 3.37576 8.78063 5.40911V11.4521C8.78063 13.4822 10.1876 14.8612 12.003 14.8612Z" fill="currentColor"/>
</svg>`;

const TAIL_PATH = `M16.8869 20.1846C11.6869 20.9846 6.55352 18.1212 4.88685 16.2879C6.60472 12.1914 -4.00107 2.24186 2.99893 2.24148C4.61754 2.24148 6 -1.9986 11.8869 1.1846C11.9081 2.47144 11.8869 6.92582 11.8869 7.6842C11.8869 18.1842 17.8869 19.5813 16.8869 20.1846Z`;

// ─── Avatar helper ────────────────────────────────────────────────────────────

function avatarInner(name, avatar, fontSize) {
  const initials = getInitials(name);
  if (avatar) return `<img src="${esc(avatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  if (initials) return `<div style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(to bottom,#A5ABB9,#858994)"><span style="font-size:${fontSize}px;font-weight:600;color:white">${esc(initials)}</span></div>`;
  return `<div style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(to bottom,#A5ABB9,#858994)"><svg viewBox="0 0 24 24" fill="white" style="width:60%;height:60%"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg></div>`;
}

function circleAvatar(name, avatar, size, fontSize) {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0">${avatarInner(name, avatar, fontSize)}</div>`;
}

// ─── Main generator ───────────────────────────────────────────────────────────

function generateHTML(config) {
  // Normalize recipients
  let recipients = config.recipients || [];
  if (!recipients.length && config.recipient) {
    recipients = [{ id: 'recipient', ...config.recipient }];
  }
  if (!recipients.length) recipients = [{ id: 'r', name: 'Unknown' }];

  const recipientMap = {};
  for (const r of recipients) recipientMap[r.id] = r;

  const isGroup = recipients.length > 1;
  const title = config.title || (isGroup ? recipients.map(r => r.name).join(', ') : recipients[0].name);

  // Assign sequential dates if none provided (1 min apart)
  const base = Date.now();
  const messages = (config.messages || []).map((m, i) => ({
    method: 'data',
    status: 'default',
    ...m,
    date: m.date || new Date(base + i * 60000).toISOString(),
  }));

  const isDark = config.mode === 'dark';
  const timeFormat = config.timeFormat || '12h';
  const time = config.time || '9:41';
  const unreads = config.unreads || 0;
  const inputPlaceholder = config.inputPlaceholder || 'iMessage';

  // Theme colors
  const headerBg   = isDark ? '#121212' : '#F6F5F6';
  const headerText = isDark ? '#FFFFFF' : '#000000';
  const bodyBg     = isDark ? '#000000' : '#FFFFFF';
  const footerBg   = isDark ? '#000000' : '#FCFCFC';
  const divider    = isDark ? '#262626' : '#B2B2B2';
  const inputBdr   = isDark ? '#212223' : '#DEDEDE';
  const appBtnBg   = isDark ? '#1F1F21' : '#E8E7EC';
  const appBtnClr  = isDark ? '#A3A3A5' : '#7E7F84';
  const tsColor    = isDark ? '#8D8D93' : '#8A898E';
  const chevClr    = isDark ? '#535356' : '#C1C1C3';
  const inputClr   = isDark ? '#4A4B4D' : '#C1C2C4';
  const homeBar    = isDark ? '#FFFFFF' : '#000000';

  // ── Header avatar(s) ───────────────────────────────────────────────────────
  let headerAvatarHTML;
  if (!isGroup) {
    headerAvatarHTML = circleAvatar(recipients[0].name, recipients[0].avatar, 40, 18);
  } else {
    const [r1, r2] = recipients;
    headerAvatarHTML = `<div style="position:relative;width:40px;height:40px">
      <div style="position:absolute;left:-5px;bottom:7px;width:28px;height:28px;border-radius:50%;overflow:hidden">${avatarInner(r1.name, r1.avatar, 13)}</div>
      <div style="position:absolute;left:23px;bottom:0;width:24px;height:24px;border-radius:50%;overflow:hidden">${avatarInner(r2.name, r2.avatar, 11)}</div>
    </div>`;
  }

  // ── Unread badge ───────────────────────────────────────────────────────────
  const badgeHTML = unreads > 0
    ? `<div style="margin-top:1px;margin-left:-3px;display:flex;height:14px;min-width:14px;align-items:center;justify-content:center;border-radius:9999px;background:#007AFF;padding:0 4px;font-size:8px;font-weight:500;color:white">${unreads}</div>`
    : '';

  // ── Messages ───────────────────────────────────────────────────────────────
  let msgsHTML = '';

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];

    // Timestamp divider when >60 min gap or first message
    if (!prev || diffMinutes(msg.date, prev.date) > 60) {
      msgsHTML += `<div style="display:flex;justify-content:center;padding:9px 0 6px;text-align:center">
        <span style="font-size:9px;font-weight:500;color:${tsColor}">${esc(formatTimestamp(msg.date, timeFormat))}</span>
      </div>`;
    }

    const isSender = msg.actor === 'sender';
    const recipient = isSender ? null : (recipientMap[msg.actor] || recipients[0]);

    // Grouping: same actor within 5 minutes = tight group (no tail, small gap)
    const sameGroup = !!(next && next.actor === msg.actor && diffMinutes(msg.date, next.date) <= 5);

    // Bottom gap: use explicit override, else 2px (same group) or 6px (end of group)
    const pb = msg.gap != null ? `${msg.gap}px` : sameGroup ? '2px' : '6px';

    // Bubble colors
    const bubbleBg   = isSender ? (msg.method === 'text' ? '#34C759' : '#007AFF') : (isDark ? '#262628' : '#E9E9EB');
    const bubbleText = isSender ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000');

    const tailSVG = sameGroup ? '' : `<svg viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:-1px;height:18px;${isSender ? 'right:-4.282px' : 'left:-4.2578px;transform:scaleX(-1)'}"><path d="${TAIL_PATH}" fill="${bubbleBg}"/></svg>`;

    const bubbleHTML = `<div style="position:relative;max-width:222px;border-radius:14px;padding:6px 10px;background:${bubbleBg};word-break:break-word;overflow-wrap:break-word">
        <div style="font-size:13px;line-height:16px;white-space:pre-wrap;color:${bubbleText}">${esc(msg.text)}</div>
        ${tailSVG}
      </div>`;

    // Status label (sender only)
    let statusHTML = '';
    if (isSender) {
      if (msg.status === 'delivered')
        statusHTML = `<div style="display:flex;justify-content:flex-end;font-size:9px;font-weight:600;color:${tsColor};margin-top:3px">Delivered</div>`;
      else if (msg.status === 'read')
        statusHTML = `<div style="display:flex;justify-content:flex-end;font-size:9px;font-weight:600;color:${tsColor};margin-top:3px">Read</div>`;
      else if (msg.status === 'not_delivered')
        statusHTML = `<div style="display:flex;justify-content:flex-end;font-size:9px;font-weight:600;color:#FD3B31;margin-top:3px">Not Delivered</div>`;
    }

    if (isSender) {
      msgsHTML += `<div style="display:flex;flex-direction:column;gap:1px;padding-bottom:${pb}">
        <div style="display:flex;width:100%;align-items:flex-end;gap:4px">
          <div style="display:flex;flex:1;flex-direction:column;align-items:flex-end">
            <div style="display:flex;flex-direction:column;gap:2px">
              <div style="display:flex;align-items:center;gap:6px">${bubbleHTML}</div>
            </div>
            ${statusHTML}
          </div>
        </div>
      </div>`;
    } else if (!isGroup) {
      // Single-recipient: no avatar column, no name label
      msgsHTML += `<div style="display:flex;flex-direction:column;gap:1px;padding-bottom:${pb}">
        <div style="display:flex;width:100%;align-items:flex-end;gap:4px">
          <div style="display:flex;flex:1;flex-direction:column;align-items:flex-start">
            <div style="display:flex;flex-direction:column;gap:2px">
              <div style="display:flex;align-items:center;gap:6px">${bubbleHTML}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else {
      // Group chat: avatar slot on left, name label when actor changes
      const actorChanged = !prev || prev.actor !== msg.actor;
      const showName = actorChanged;
      const showAvatar = !sameGroup;

      const avatarSlot = showAvatar
        ? circleAvatar(recipient.name, recipient.avatar, 24, 10)
        : `<div style="width:24px;height:24px;flex-shrink:0"></div>`;

      // Name label: shown when actor changes, with small bottom margin for spacing
      const nameLabel = showName
        ? `<span style="margin-left:10px;margin-bottom:2px;font-size:9px;color:${tsColor};display:block">${esc(recipient.name)}</span>`
        : '';

      msgsHTML += `<div style="display:flex;flex-direction:column;gap:1px;padding-bottom:${pb}">
        <div style="display:flex;width:100%;align-items:flex-end;gap:4px">
          ${avatarSlot}
          <div style="display:flex;flex:1;flex-direction:column;align-items:flex-start">
            ${nameLabel}
            <div style="display:flex;flex-direction:column;gap:2px">
              <div style="display:flex;align-items:center;gap:6px">${bubbleHTML}</div>
            </div>
          </div>
        </div>
      </div>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://rsms.me/" crossorigin>
<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: transparent; display: inline-block; }
  .scroll { overflow: auto; }
  .scroll::-webkit-scrollbar { display: none; }
</style>
</head>
<body>
<div id="phone" style="
  position:relative; display:flex; flex-direction:column;
  height:684px; width:316px;
  font-family:'Inter',sans-serif; font-feature-settings:normal;
  overflow:hidden;
  background:white;
">

  <!-- Status bar -->
  <div style="position:absolute;left:0;right:0;top:0;z-index:10;padding-top:13px;color:${headerText}">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 25px 0 31px">
      <span style="font-size:14px;font-weight:600">${esc(time)}</span>
      <div style="display:flex;align-items:center;gap:5px">
        ${signalSVG(config.signal || 'full')}
        ${wifiSVG(config.wifi || 'strong')}
        ${batterySVG(config.battery || 'full')}
      </div>
    </div>
  </div>

  <!-- Main layout -->
  <div style="display:flex;height:100%;flex-direction:column">

    <!-- Contact header -->
    <div style="position:relative;display:flex;flex-direction:column;padding-top:50px;padding-bottom:6px;background:${headerBg}">
      <div style="position:relative;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;left:12px;display:flex;align-items:center">
          ${BACK_CHEVRON}${badgeHTML}
        </div>
        ${headerAvatarHTML}
        <div style="position:absolute;right:17px">${VIDEO_CALL}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;margin:2.5px auto 0;max-width:65%;overflow:hidden">
        <span style="font-size:9px;color:${headerText};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</span>
        <span style="color:${chevClr}">${NAME_CHEVRON}</span>
      </div>
      <svg style="position:absolute;left:0;right:0;bottom:0;width:100%" height="1">
        <line stroke="${divider}" x1="0" y1="0" x2="100%" y2="0" stroke-width="1"/>
      </svg>
    </div>

    <!-- Messages -->
    <div class="scroll" style="flex:1;overflow:auto;padding:0 11px;background:${bodyBg}">
      ${msgsHTML}
    </div>

    <!-- Input bar -->
    <div style="display:flex;align-items:center;gap:10px;padding:4px 11px 33px;background:${footerBg}">
      <div style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:50%;background:${appBtnBg};color:${appBtnClr};flex-shrink:0">
        ${APP_BUTTON}
      </div>
      <div style="display:flex;flex:1;align-items:center;overflow:hidden;border-radius:9999px;border:1px solid ${inputBdr};padding:4.5px 10px;gap:4px">
        <span style="flex:1;font-size:13px;color:${inputClr};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(inputPlaceholder)}</span>
        ${MICROPHONE}
      </div>
    </div>

  </div>

  <!-- Home indicator -->
  <div style="position:absolute;left:0;right:0;bottom:0;z-index:10;display:flex;align-items:center;justify-content:center;padding-bottom:6px">
    <div style="height:4px;width:112px;border-radius:9999px;background:${homeBar}"></div>
  </div>

</div>
</body>
</html>`;
}

// ─── Browser detection ────────────────────────────────────────────────────────

const CHROME_PATHS = [
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  // Playwright-installed Chromium (fallback)
  path.join(require('os').homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-mac/headless_shell'),
  path.join(require('os').homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux/chrome'),
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    try { if (fs.statSync(p).isFile()) return p; } catch {}
  }
  return null;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { parsed[args[i].slice(2)] = args[i + 1]; i++; }
  }

  let config;
  if (parsed.config) {
    config = JSON.parse(fs.readFileSync(parsed.config, 'utf8'));
  } else {
    config = {
      recipients: [{ id: 'r', name: parsed.sender || 'Unknown' }],
      messages: parsed.messages ? JSON.parse(parsed.messages) : [],
      mode: parsed.mode || 'light',
      time: parsed.time || '9:41',
    };
  }

  const outputPath = parsed.output || `imessage-screenshot-${Date.now()}.png`;
  const html = generateHTML(config);

  if (parsed['html-output']) {
    fs.writeFileSync(parsed['html-output'], html);
    console.log(`HTML → ${parsed['html-output']}`);
  }

  const executablePath = findChrome();
  if (!executablePath) {
    console.error('No Chrome/Chromium found. Install Chrome or run: npx playwright install chromium');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 900, deviceScaleFactor: 3 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const el = await page.$('#phone');
  await el.screenshot({ path: outputPath });
  await browser.close();
  console.log(`Saved → ${outputPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
