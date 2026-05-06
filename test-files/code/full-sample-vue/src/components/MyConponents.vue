<template>
    <div>
        <h1>{{ $t("vue.template.key") }}</h1>
        <!-- <div >{{ $t('not-collected') }}</div> -->
        <!-- <div >
            <p>{{ $t('not-collected') }}</p>
            <p>{{ $t('not-collected') }}</p>
        </div> -->

    </div>
</template>

<script setup lang="ts">
const label = $t("vue.script.key");
</script>