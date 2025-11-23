import home from '../screens/first.js'







const screen = {}

screen.EVENTS = {
    'OPEN_PAGE': 'openPage'
}

screen.PAGE_IDs = Object.freeze({
    'HOME': home.ID
})










screen.open = function open(pageID) {
    let page = screenID_object_map[pageID]
    if (page) {
        if (currentPage && currentPage !== page) currentPage.close()
        currentPage = page
        currentPage.open()
    }
}






/*
--------------------PRIVATE--------------------
*/



let currentPage = null

const screenID_object_map = {
    [home.ID]: home
}





export default screen
