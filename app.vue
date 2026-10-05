<script setup>
// Megosztási előnézet (Facebook, Messenger, Viber, iMessage, X stb.)
const { origin } = useRequestURL()
const shareTitle = 'Szatmár Solar – Csökkentse a villanyszámláját saját árammal'
const shareDescription =
  'Napelemes rendszer és energiatárolás kulcsrakészen. Ingyenes, kötelezettségmentes helyszíni felmérés és megtakarítás-kalkuláció.'

useSeoMeta({
  ogType: 'website',
  ogLocale: 'hu_HU',
  ogSiteName: 'Szatmár Solar',
  ogTitle: shareTitle,
  ogDescription: shareDescription,
  ogImage: `${origin}/og-image.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Szatmár Solar – Csökkentse a villanyszámláját saját árammal',
  twitterCard: 'summary_large_image',
  twitterTitle: shareTitle,
  twitterDescription: shareDescription,
  twitterImage: `${origin}/og-image.jpg`,
})
</script>

<template>
  <div>
    <!-- <AppHeader /> -->
    <NuxtPage />
    <!-- <AppFooter /> -->
  </div>
</template>
