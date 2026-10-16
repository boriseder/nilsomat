<script lang="ts">
  interface Props {
    name:
      | 'back'
      | 'play'
      | 'pause'
      | 'replay30'
      | 'skip-prev'
      | 'skip-next'
      | 'moon'
      | 'books'
      | 'podcasts'
      | 'music'
      | 'check'
      | 'reload'
      | 'close'
      | 'sparkle';
    size?: number;
    color?: string;
  }

  const { name, size = 32, color = 'currentColor' }: Props = $props();
</script>

<svg
  class="icon-svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  style="color: {color};"
>
  {#if name === 'back'}
    <!-- Modern rounded back arrow -->
    <path
      d="M19 12H5M11 18l-6-6 6-6"
      stroke="currentColor"
      stroke-width="2.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'play'}
    <!-- Modern rounded play triangle -->
    <path
      d="M7 5.24v13.52c0 .8.88 1.3 1.57.88l11.08-6.76a1.03 1.03 0 0 0 0-1.76L8.57 4.36A1.03 1.03 0 0 0 7 5.24z"
      fill="currentColor"
    />
  {:else if name === 'pause'}
    <!-- Modern rounded pause bars -->
    <rect x="6" y="4" width="4.2" height="16" rx="2.1" fill="currentColor" />
    <rect x="13.8" y="4" width="4.2" height="16" rx="2.1" fill="currentColor" />
  {:else if name === 'replay30'}
    <!-- Modern counter-clockwise 30s jump-back -->
    <path
      d="M3.5 10A8.5 8.5 0 1 1 5.3 15.5"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
    />
    <path
      d="M3.5 5.5v4.5h4.5"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <text
      x="12"
      y="14.5"
      text-anchor="middle"
      fill="currentColor"
      font-size="6.8"
      font-weight="900"
      font-family="system-ui, -apple-system, sans-serif"
    >
      30
    </text>
  {:else if name === 'skip-prev'}
    <!-- Modern previous track -->
    <path
      d="M18 18.5L8.5 12 18 5.5v13zM6 5.5v13"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="currentColor"
    />
  {:else if name === 'skip-next'}
    <!-- Modern next track -->
    <path
      d="M6 5.5l9.5 6.5L6 18.5V5.5zM18 5.5v13"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="currentColor"
    />
  {:else if name === 'moon'}
    <!-- Modern smooth crescent moon -->
    <path
      d="M20.5 13.05A9 9 0 1 1 10.95 3.5a7 7 0 0 0 9.55 9.55z"
      fill="currentColor"
    />
  {:else if name === 'books'}
    <!-- Modern friendly open book -->
    <path
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3z"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'podcasts'}
    <!-- Modern microphone with soundwaves -->
    <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" stroke-width="2.2" />
    <path
      d="M5 10a7 7 0 0 0 14 0M12 18v4M8 22h8"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
    />
  {:else if name === 'music'}
    <!-- Modern double musical note -->
    <path
      d="M9 18V5l12-2v13"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="6" cy="18" r="3" fill="currentColor" />
    <circle cx="18" cy="16" r="3" fill="currentColor" />
  {:else if name === 'check'}
    <!-- Modern rounded checkmark -->
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'reload'}
    <!-- Modern circular reload -->
    <path
      d="M21 4v5h-5"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M19.5 15.5A9 9 0 1 1 20.8 9.5L21 9"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  {:else if name === 'close'}
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      stroke-width="2.8"
      stroke-linecap="round"
    />
  {:else if name === 'sparkle'}
    <path
      d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
      fill="currentColor"
    />
  {/if}
</svg>

<style>
  .icon-svg {
    display: inline-block;
    flex-shrink: 0;
    vertical-align: middle;
  }
</style>
