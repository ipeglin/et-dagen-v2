<template>
  <footer>
    <section class="top">
      <NuxtImg height="80" class="mb-8" src="/images/logo_long_neg.png" />
      <ul class="pa-0 ma-0">
        <li>
          <span class="header fade text-h4">{{
            $t('footer.header.resources')
          }}</span>
          <NuxtLink to="/programme">{{ $t('footer.link.program') }}</NuxtLink>
          <NuxtLink to="/jobs">{{ $t('footer.link.jobs') }}</NuxtLink>
        </li>
        <li>
          <span class="header fade text-h4">{{
            $t('footer.header.join')
          }}</span>
          <NuxtLink to="mailto:bedriftansvarlig@et-dagen.no">
            <VIcon icon="mdi-email" class="fade mr-2 mail-icon" size="small" />
            {{ $t('contact.positions.business') }}
          </NuxtLink>
          <NuxtLink to="mailto:logistikk@et-dagen.no">
            <VIcon icon="mdi-email" class="fade mr-2 mail-icon" size="small" />
            {{ $t('contact.positions.logistics') }}
          </NuxtLink>
        </li>
        <li>
          <span class="header fade text-h4">{{
            $t('footer.header.organisation')
          }}</span>
          <NuxtLink to="https://www.ntnu.no/studier/mtelsys" target="_blank">
            MTELSYS
          </NuxtLink>
          <NuxtLink to="/contact">{{ $t('footer.link.contact') }}</NuxtLink>
          <NuxtLink to="https://github.com/et-dagen" target="_blank">
            GitHub
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section class="bottom">
      <span>Elektronikk- & Teknologidagene</span>
      <span class="fade">Addr.: O.S. Bragstads plass 2, 7034 TRONDHEIM</span>
      <span class="fade">Org nr.: 996 858 545</span>
    </section>
  </footer>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  * {
    box-sizing: border-box;
    color: rgb(var(--v-theme-background)) !important;
  }

  .fade {
    color: rgba(var(--v-theme-background), 0.7) !important;
  }

  footer {
    margin-top: calc(50px + 4vw) !important;
    padding-block: 20px;
    background-color: rgb(var(--v-theme-primary));
    clip-path: polygon(0 0%, 100% 4vw, 100% 100%, 0 100%);

    section {
      padding: 0 50px;

      &.bottom {
        padding-top: 10px;
        border-top: 1px solid rgba(var(--v-theme-background), 0.1) !important;
        display: flex;
        flex-direction: column;
      }

      &.top {
        padding-top: 30px;
        margin-bottom: 48px;

        .header {
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 20px !important;
        }

        ul {
          list-style: none;
          display: grid;
          gap: 30px;
          grid-template-columns: repeat(2, 1fr);

          li a {
            display: block;
            margin-bottom: 10px;
          }
        }
      }
    }
  }

  @media #{map-get(settings.$display-breakpoints, 'md-and-up')} {
    footer section {
      &.top ul {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  }

  @media #{map-get(settings.$display-breakpoints, 'sm')} {
    footer section {
      &.top ul {
        grid-template-columns: repeat(3, 1fr);

        .mail-icon {
          display: none !important;
        }
      }
    }
  }

  @media #{map-get(settings.$display-breakpoints, 'xs')} {
    footer section {
      &.top ul {
        grid-template-columns: repeat(2, 1fr);

        .mail-icon {
          display: none !important;
        }
      }
    }
  }
</style>
