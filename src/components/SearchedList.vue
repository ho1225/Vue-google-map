<template>
    <div class="card text-center">
        <h6 class="card-header p-1">Searched Place</h6>
        <div class="card-body p-0">
            <div v-for="item in pageOfItems" v-if="searchedAddressList" :key="item.id">
                <div class="ui checkbox">
                    <input 
                        type="checkbox"
                        :value="item.id"
                        v-model="checkedAddresses"
                    >
                    <label>{{item.address}}</label>
                </div>
            </div>
            <button 
                class="ui button"
                @click="deleteButtonClicked"
            >
                Delete
            </button>
        </div>
        <div class="card-footer p-1">
            <jw-pagination :items="searchedItems" @changePage="onChangePage" class="pagination"></jw-pagination>
        </div>
    </div>
    
</template>


<script>
export default {

    data() {
        return {
            checkedAddresses: [],
            pageOfItems: [],
            searchedAddressList: this.searchedAddress,
        };
    },
    props: ['searchedAddress'],
    computed: {
        searchedItems(){
            return [...this.searchedAddress].map((address, index) => ({ id: index+1, address: address }));
        }
    }, 
    methods: {
        onChangePage(pageOfItems) {
            // update page of items
            this.pageOfItems = pageOfItems;
            
        },
         deleteButtonClicked() {
            // Filter out the items with IDs in checkedAddresses
            this.pageOfItems = this.pageOfItems.filter(
                (item) => {
                    if (this.checkedAddresses.includes(item.id)) {
                        // Remove the item from searchedAddressList
                        this.searchedAddressList.splice( this.searchedAddressList.findIndex(address => address === item.address) , 1);
                        return false; // Do not include this item in pageOfItems
                    }
                    return true; // Include this item in pageOfItems
                    }
            );
            // Clear the checkedAddresses array
            this.$emit("deleteMarkersEvent", this.searchedAddressList)
            this.checkedAddresses = [];
        },
    }
};
</script>

<style>
.card {
    font-size: small;
    
}
.page-item.active .page-link {
    background-color: darkseagreen;
    border-color: darkseagreen;
}

</style>