<script lang="ts">
  interface Props {
    coverSrc: string;
    altText: string;
    dominantColor?: string;
    size?: 320 | 640 | 1280;
    fetchPriority?: 'high' | 'auto' | 'low';
    loading?: 'lazy' | 'eager';
  }

  const {
    coverSrc,
    altText,
    dominantColor = '#1e293b',
    size = 640,
    fetchPriority = 'auto',
    loading = 'lazy'
  }: Props = $props();

  let loaded = $state(false);

  // Basis-Pfad ohne bestehendes w-Parameter
  const baseSrc = $derived(coverSrc.replace(/([?&])w=\d+/, '$1').replace(/[?&]$/, ''));
  const sep = $derived(baseSrc.includes('?') ? '&' : '?');

  const srcSet = $derived(`
    ${baseSrc}${sep}w=320 320w,
    ${baseSrc}${sep}w=640 640w,
    ${baseSrc}${sep}w=1280 1280w
  `.trim());

  const currentSrc = $derived(`${baseSrc}${sep}w=${size}`);
</script>

<div
  class="cover-wrapper"
  style="--dominant-color: {dominantColor};"
>
  <!-- Unscharfer abgedunkelter Hintergrund für nicht-quadratische Cover -->
  <img
    class="cover-backdrop"
    src={currentSrc}
    alt=""
    aria-hidden="true"
    tabindex="-1"
  />

  <!-- Haupt-Cover mit object-fit: contain (nie verzerrt oder abgeschnitten) -->
  <img
    class="cover-img"
    class:loaded
    src={currentSrc}
    srcset={srcSet}
    sizes="(max-width: 820px) 50vw, 33vw"
    alt={altText}
    decoding="async"
    loading={loading}
    fetchpriority={fetchPriority}
    onload={() => (loaded = true)}
  />
</div>

<style>
  .cover-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 28px;
    overflow: hidden;
    background-color: var(--dominant-color, #1e293b);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }

  .cover-backdrop {
    position: absolute;
    inset: -10%;
    width: 120%;
    height: 120%;
    object-fit: cover;
    filter: blur(24px) brightness(0.45);
    transform: scale(1.1);
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .cover-img {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: 1;
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  .cover-img.loaded {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .cover-img {
      transition: none;
      opacity: 1;
    }
  }
</style>
