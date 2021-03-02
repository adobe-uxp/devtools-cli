function changeColor(){
	if(document.body.style.color == "red"){
                document.body.style.color = "black";
            }
            else {
                document.body.style.color = "red";
            }
}

document.getElementById("change_color").addEventListener("click", changeColor);


