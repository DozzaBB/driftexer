<template>
    <!-- <pre>{{  items }}</pre> -->
    <Galleria circular :autoPlay=true :transitionInterval=10000 :numVisible=10 :value="items" containerStyle="height: 95vh">
    <template #item="slotProps">
        <div>
            <Image :src="slotProps.item.src" width="100%"></Image>
            <br>
            <p style="margin: auto">{{ dateFetched }} - {{ slotProps.item.desc }}</p>
        </div>
    </template>
    <template #thumbnail="slotProps">
        <img :src="slotProps.item.src" style="height: 50px">
    </template>
</Galleria>
<div v-if="items.length === 0">No items loaded yet...</div>
</template>

<script lang="ts">
import Galleria from 'primevue/galleria';
import Image from 'primevue/image';
export default {
    components: {
        Galleria,
        Image,
    },
    data() {
        return {
            items: [],
            dateFetched: 'fetching...',
        }
    },
    mounted() {
        console.log("fetching latest")
        fetch("/latest").then((r) => {
            console.log("got response from latest");

            r.json().then((j) => {
            console.log(j);
            this.items = j.pairs;
            this.dateFetched = j.date;
            })
        })
    }
}
</script>