// made by _MotokoKusanagi
// contact: motokusanagi
/// BIND TO OPENCONTAINER EVENT

const BUTTON_WIDTH = 80
const BUTTON_HEIGHT = 22
let CRAFTABLE_COUNTS_SHOW = false

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
    } // clear craftable tbtns
    const ROW_BTN_LIMIT = 6
    let i = 0

    INV.getCraftableRecipes().forEach(recipeHelper => {
        const tbtn = { 
            x: 40 * (i%ROW_BTN_LIMIT+1), 
            y: 40 * (Math.floor(i/ROW_BTN_LIMIT)+1) + Math.floor(SCR.getHeight() / 2 - SCR.getHeight() / 4), 
            recipe: recipeHelper,
            actionWrapper:  (shiftCraft) => (() => {recipeHelper.craft(shiftCraft); Client.waitTick(3); INV.quick(0)}) 
        }
        addTexturedButton(tbtn)
        i++
    })    
}

function addTexturedButton(tbtn) {
    TEXTURED_BUTTONS.push(tbtn) // add to list
    tbtn.item = SCR.addItem(tbtn.x, tbtn.y, 10, tbtn.recipe.getId(), false, 2, 0)
    tbtn.width = tbtn.item.getScaledWidth()
    tbtn.height = tbtn.item.getScaledHeight()
    tbtn.background = SCR.addRect(tbtn.x, tbtn.y, tbtn.x + tbtn.item.getScaledHeight(), tbtn.y + tbtn.item.getScaledWidth(), 0, 0x00008F, 0, tbtn.item.getZIndex()-1)
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
///////////////////////////////////////////////////////////////
/// BIND TO OPENCONTAINER EVENT
const INV = event.inventory
const SCR = event.screen
const TEXTURED_BUTTONS = []

if (INV.getContainerTitle() == "Crafting") {
    SCR.setOnMouseDown(JavaWrapper.methodToJavaAsync(clicked_screen))
    let inventoryUpdateListener = JsMacros.on('SlotUpdate', JavaWrapper.methodToJava((e) => {
        if (e.type == "INVENTORY" && e.slot < 5 ||
            e.type == "CONTAINER" && e.slot < 10)
            return
        drawCraftableList()
    }));
    SCR.setOnClose(JavaWrapper.methodToJavaAsync(() => {JsMacros.off(inventoryUpdateListener)}))
    SCR.setOnKeyPressed(JavaWrapper.methodToJavaAsync((char, i) => {
        if (!CRAFTABLE_COUNTS_SHOW && char == 340)
            showCraftableAmounts()
        Client.waitTick(10)
        if (CRAFTABLE_COUNTS_SHOW && KeyBind.getPressedKeys().size() == 0)
            hideCraftableAmounts()
        
    }))
    drawCraftableList()
}  