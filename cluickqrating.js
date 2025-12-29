// made by _MotokoKusanagi
// contact: motokusanagi
/// BIND TO OPENCONTAINER EVENT

const gameOptions = Client.getGameOptions()
let CRAFTABLE_COUNTS_SHOW = false
const SCRIPT_NAME = "cluickqrating"

let screenScale = 1
let uiScale = 1
let DRAWN_RECIPES = new Set()
const SCR = event.screen
const INV = event.inventory
const TEXTURED_BUTTONS = []

function showCraftableAmounts() {
    CRAFTABLE_COUNTS_SHOW = true
    TEXTURED_BUTTONS.forEach(tbtn => {
        tbtn.item.setOverlayText(`${tbtn.recipe.getCraftableAmount() * tbtn.recipe.getOutput().getCount()}`).setOverlay(true)
    })
}

function hideCraftableAmounts() {
    CRAFTABLE_COUNTS_SHOW = false
    TEXTURED_BUTTONS.forEach(tbtn => {
        tbtn.item.setOverlay(false)
    })
}

function drawCraftableList() {
    while(!!TEXTURED_BUTTONS.length) {
        let btn = TEXTURED_BUTTONS.pop()
        SCR.removeElement(btn.item)
        SCR.removeElement(btn.background)
        DRAWN_RECIPES.delete(btn.item.getItem().getItemId())
    } // clear craftable tbtns
    const ROW_BTN_LIMIT = 8
    let i = 0
    INV.getCraftableRecipes().forEach(recipeHelper => {
        if (DRAWN_RECIPES.has(recipeHelper.getOutput().getItemId()))
            return
        const tbtn = { 
            x: (20 * screenScale) * (i % ROW_BTN_LIMIT+1) - 10, 
            y: (20 * screenScale) * (Math.floor(i/ROW_BTN_LIMIT)+1) + Math.floor(SCR.getHeight() * (SCR.getHeight()/gameOptions.getHeight())), 
            recipe: recipeHelper,
            actionWrapper:  (shiftCraft) => (() => {recipeHelper.craft(shiftCraft); Client.waitTick(3); INV.quick(0)}) 
        }
        addTexturedButton(tbtn)
        i++
        DRAWN_RECIPES.add(recipeHelper.getOutput().getItemId())
    })    
}

function addTexturedButton(tbtn) {
    TEXTURED_BUTTONS.push(tbtn) // add to list
    tbtn.item = SCR.addItem(tbtn.x, tbtn.y, 10, tbtn.recipe.getOutput().getItemId(), false, screenScale, 0)
    tbtn.width = tbtn.item.getScaledWidth()
    tbtn.height = tbtn.item.getScaledHeight()
    tbtn.background = SCR.addRect(tbtn.x, tbtn.y, tbtn.x + tbtn.height, tbtn.y + tbtn.width, 0, 0x00008F, 0, tbtn.item.getZIndex()-1)
}

function clicked_TexturedButton(tbtn, shiftCraft) {
    JavaWrapper.methodToJavaAsync(tbtn.actionWrapper(shiftCraft)).run() // do action
    World.playSound("ui.button.click", 0.18, 1) // make button noise
}

function clicked_screen(clickPos, _) {
    const shiftCraft = SCR.isShiftDown()
    for (let i = 0; i < TEXTURED_BUTTONS.length; i++) {
        let tbtn = TEXTURED_BUTTONS[i]
        if (tbtn.x <= clickPos.getX() && clickPos.getX() <= tbtn.x + tbtn.width
        && tbtn.y <= clickPos.getY() && clickPos.getY() <= tbtn.y + tbtn.height) {
            clicked_TexturedButton(tbtn, shiftCraft)
            break
        }
    }
}



if (event.inventory.getType() == "Crafting Table") {
    screenScale = {3840: 2, 1920: 1}[Client.getGameOptions().getWidth()] ?? screenScale
    uiScale = gameOptions.getVideoOptions().getGuiScale()

    SCR.setOnMouseDown(JavaWrapper.methodToJavaAsync(clicked_screen)) // click handler
    SCR.setOnScroll(JavaWrapper.methodToJavaAsync(clicked_screen)) // scroll handler
    let inventoryUpdateListener = JsMacros.on('SlotUpdate', JavaWrapper.methodToJava((e) => { // available ingredients changed
        if (e.type == "INVENTORY" && e.slot < 5 ||
            e.type == "CONTAINER" && e.slot < 10)
            return
        drawCraftableList()
    })); 
    SCR.setOnKeyPressed(JavaWrapper.methodToJavaAsync((char, i) => { // show craftable count 
        if (!CRAFTABLE_COUNTS_SHOW && char == 340)
            showCraftableAmounts()
        Client.waitTick(10)
        if (CRAFTABLE_COUNTS_SHOW && KeyBind.getPressedKeys().size() == 0)
            hideCraftableAmounts()
        
    }))
    drawCraftableList()

    SCR.setOnClose(JavaWrapper.methodToJavaAsync(() => {JsMacros.off(inventoryUpdateListener)})) // clean up
}  