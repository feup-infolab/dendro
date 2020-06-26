angular.module("dendroApp.controllers")
/*
    *  Notebook controller
    */
    .controller("notebookViewCtrl", function (
        $scope
    )
    {
        $scope.init = function ()
        {

        };

        $scope.start_listener = function ()
        {

        };

        $scope.start_dropzone = function ()
        {
            var d = document;
            var doc = d.getElementById("doc");
            var fs = d.getElementById("file-selector");
            fs.addEventListener("change", function ()
            {
                var nbs = doc.childNodes;
                for (var j = 0; j < nbs.length; j++)
                {
                    if (nbs[j].nodeName != "DIV")
                    {
                        if (nbs[j].getAttribute("rel") == fs.value)
                        {
                            nbs[j].style.display = "block";
                            continue;
                        }
                    }
                    nbs[j].style.display = "none";
                }
            });
            var dz = d.createElement("div");
            dz.style.visibility = "hidden";
            dz.setAttribute("id", "dropzone");
            d.getElementsByTagName("body")[0].appendChild(dz);

            window.addEventListener("dragenter", function (e)
            {
                dz.style.opacity = 0.3;
                dz.style.visibility = "";
            });
            dz.addEventListener("dragenter", dzenter, false);
            dz.addEventListener("dragover", dzover, false);
            dz.addEventListener("drop", dzdrop, false);

            function dzenter (e)
            {
                e.stopPropagation();
                e.preventDefault();
            }

            function dzover (e)
            {
                e.stopPropagation();
                e.preventDefault();
            }

            function dzdrop (e)
            {
                dz.style.opacity = 0;
                dz.style.visibility = "hidden";
                e.stopPropagation();
                e.preventDefault();
                var fns = e.dataTransfer.files;
                renderFiles(fns);
            }

            function renderFiles (fns)
            {
                d.getElementById("instructions").style.display = "none";
                fs.style.display = "block";
                for (var j = 0; j < fns.length; j++)
                {
                    var fn = fns[j];
                    if (!fn.name.endsWith(".ipynb"))
                    {
                        console.log("File " + fn.name + " not a Jupyter notebook, skipping");
                        continue;
                    }
                    var rd = new FileReader();
                    rd.addEventListener("load", (function (j, rd, fn)
                    {
                        return function ()
                        {
                            var dt = JSON.parse(rd.result);
                            // Does a container for this file exist already?
                            // If not, create it
                            var tg = doc.querySelector("div[rel=\"" + fn.name + "\"]");
                            if (tg === null)
                            {
                                tg = d.createElement("div");
                                tg.setAttribute("rel", fn.name);
                                doc.appendChild(tg);
                            }

                            if (!(fs.getElementsByTagName("option").length == 0 ||
                                fs.value == fn.name))
                            {
                                tg.style.display = "none";
                            }
                            // adding notebooks to selector
                            if (fs.querySelector("option[value=\"" + fn.name + "\"]") === null)
                            {
                                var op = d.createElement("option");
                                op.textContent = fn.name;
                                fs.appendChild(op);
                            }
                            nbv.render(dt, tg);
                        };
                    })(j, rd, fn));
                    rd.readAsText(fn);
                }
            }
        };
    });

