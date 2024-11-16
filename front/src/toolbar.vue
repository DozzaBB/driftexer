<template>
    <!-- its gonna be a sidebar. -->
    <Drawer v-model:visible="visible" :numVisible="5" header="Drawer">
        <InputGroup>
        <InputText placeholder="Custom Driftex Prompt" v-model="prompt" />
        <Button @click="sendCustom()">Send</Button>
    </InputGroup>
        <button @click="sendRefreshAll()">send refresh to all clients</button>
        <button @click="testToast()">Test Toast</button>
    </Drawer>
    <button @click="visible = !visible" >Toolbar</button>
  
</template>
<script lang="ts">
import Drawer from 'primevue/drawer';
import { io } from 'socket.io-client';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import { InputText } from 'primevue';
import Button from 'primevue/button';

const socket = io();

socket.on('connect', () => {
    console.log("Socket connected!");
})

socket.on('refreshAllClients', () => {
    window.location.reload();
})

export default {
    name: "toolbar",
    data() {
        return {
            visible: false,
            prompt: null,
        }
    },
    components: {
        Drawer, 
        InputGroup,
        InputGroupAddon,
        InputText,
        Button
    },
    methods: {
        sendCustom() {
            socket.emit('customDriftex', this.prompt)
        },
        sendRefreshAll() {
            socket.emit('refreshAll')
            console.log("Hello");
        },
        testToast() {
            this.$toast.add({ severity: 'info', summary: 'Info', detail: 'Message Content', life: 3000 });        }
    }
}

</script>