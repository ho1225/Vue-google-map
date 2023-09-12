<template>
    <div>
        <section class="ui two column grid form-section">
            <div class="column">
                <form class="ui segment massive form">
                    <div class="ui segment">
                        <div class="ui field">
                            <div class="ui eight wide right icon input large" :class="{loading:spinner}">
                                <input type="text" placeholder="Enter your address" v-model="address" ref="autocomplete"/>
                                <i 
                                    class="location arrow link icon"
                                    @click="locationButtonClicked"
                                ></i>
                            </div>
                        </div>
                        <button 
                            class="ui button"
                            @click="searchButtonClicked"
                        >
                            Search
                        </button>
                    </div>
                    <div v-if="error" class="ui message red">{{ error }}</div>
                    <div class="ui">
                        <p>
                            Latest searched location
                        </p>
                        <p>
                            Time Zone: {{ timeZone }}
                        </p>
                        <p>
                            Local Time (Month/Date/Year, Time): {{ localTime }}
                        </p>
                    </div>
                    
                </form>
            </div>
            <div class="column">
                <form class="ui segment massive form">
                    <SearchedList :searched-address="searchedAddress" v-on:deleteMarkersEvent="deleteMarkers" />
                </form>
            </div>
        </section>
        <section id="map">

        </section>
    </div>
    
</template>

<script>

import axios from 'axios'
// import dotenv from 'dotenv';
import SearchedList from '../components/SearchedList.vue'

// const config = dotenv.config();

//   console.log('Could not load env file', config.error)

console.log("123", process.env.VUE_APP_GOOGLE_API_KEY)
export default{
    name: "userLocation",
    components:{
        SearchedList: SearchedList
    },
    
    data() {
        return {
            address: "",
            error: "",
            spinner: false,
            timeZone: "",
            localTime: "",
            searchedAddress: [],
            searchedCoordinates: [],
        }
    },

    mounted(){
        let autocomplete = new google.maps.places.Autocomplete(this.$refs["autocomplete"], {
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(43.651070, -79.347015)
            )
        }) 
        autocomplete.addListener("place_changed", () => {
            let place = autocomplete.getPlace()
            // console.log(place)
            if(place.formatted_address){
                //auto complete case
                this.address = place.formatted_address
                this.searchedAddress.push(this.address)
                this.showLocationOnMap(place.geometry.location.lat(), place.geometry.location.lng())
            } else {
                //manually type case
                this.address = place.name
                this.searchedAddress.push(this.address)
                // this.getCoordinate(this.address)
            }
            
        })
        
    },
    methods: {

        searchButtonClicked(){
            if(this.address){
                this.getCoordinate(this.address)
            }
        },

        locationButtonClicked() {
            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(position => {

                    this.getAddress(position.coords.latitude, position.coords.longitude)
                    
                    this.showLocationOnMap(position.coords.latitude, position.coords.longitude)
                },
                error => {
                    this.error = error.message + ". There is an error about finding your address. Please type your address manually"
                    this.spinner = false
                })
                    
                
            }else{
                this.error="Broswer not support geolocaiton API"
                this.spinner = false
            }
        },
        getCoordinate(address) {
            if(address==="None"){ // no location in searched address list
                this.showLocationOnMap()
            }else {
                axios
                .get("https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=" + process.env.VUE_APP_GOOGLE_API_KEY)
                .then(response => {
                    if(response.data.status === "ZERO_RESULTS"){
                        this.error = "Please enter a valid address"
                        this.searchedAddress.pop()
                    }else {
                        this.showLocationOnMap(response.data.results[0].geometry.location.lat, response.data.results[0].geometry.location.lng)
                    }
                   
                })
                .catch(error => {
                    console.log(error.message)
                    this.error = error.message
                })
            }
            
        },
        getAddress(lat, long) {
            this.spinner = true

            axios
                .get("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + long + "&key=" + process.env.VUE_APP_GOOGLE_API_KEY)
                .then(response => {
                    if(response){
                        this.address = response.data.results[0].formatted_address
                        this.searchedAddress.push(this.address)
                    } else{
                        this.error = "No response retrieved"
                    }
                    this.spinner = false
                })
                .catch(error => {
                    console.log(error.message)
                    this.error = error.message
                    this.spinner = false
                })
                
                
        },
        getTimeZone(lat, lng){
            var targetDate = new Date()
            var timestamp = targetDate.getTime()/1000 + targetDate.getTimezoneOffset() * 60
            axios
                .get("https://maps.googleapis.com/maps/api/timezone/json?location="+ lat + "," + lng + "&timestamp=" + timestamp + "&key=" + process.env.VUE_APP_GOOGLE_API_KEY)
                .then(response => {
                    if(response.data.status === "OK"){
                        this.timeZone = response.data.timeZoneId + " (" + response.data.timeZoneName + ")"
                        this.localTime = new Date((timestamp + response.data.dstOffset + response.data.rawOffset) * 1000).toLocaleString('en-us')
                    }
                    
                })
                .catch(error =>{
                    console.log(error.message)
                    this.error = error.message
                })
        },
        showLocationOnMap(lat, lng){
            if(lat && lng){
                //set map
                let map = new google.maps.Map(document.getElementById("map"), {
                    zoom:13,
                    center: {lat: lat, lng: lng},
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                })

                //set markers
                this.searchedCoordinates.push({lat: lat, lng: lng})
                this.searchedCoordinates.map((searchedCoordinate => {
                    new google.maps.Marker({
                        position: searchedCoordinate,
                        map: map
                    })
                }))

                //timezone
                this.getTimeZone(lat, lng)
                this.error = ""
            }else { //no location in searched address list
                //set map
                let map = new google.maps.Map(document.getElementById("map"), {
                    zoom:13,
                    center: {lat: 43.651070, lng: -79.347015},
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                })
            }
            


        },
        deleteMarkers(data){
            this.searchedCoordinates = [] // remove all markers
            if(data.length === 0) { //no location in searched address list
                this.getCoordinate("None") 
            }else{ // there is still location in searched address list
                this.searchedAddress = data // add markers to remaining locations
                this.searchedAddress.map((address) => {
                this.getCoordinate(address)
            })
            }
            
        },
    }
}
</script>


<style>
    @import '../css/UserLocation.css';
</style>