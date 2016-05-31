于是工作流程变成了

这中间减少了重新编辑没有修改过的图层的工作

  psd 
-> psd_tree
-> dom_info_patch + dom_info_tree
-> template & css

when psd modified

  psd 
-> psd_tree_new
-> psd_tree_patch
-> (patch) new_dom_info_tree + new_dom_info_tree
-> template & css

then 还缺少一个

psd_tree -> dom_info_patch + dom_info_tree 
