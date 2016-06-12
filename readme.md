psd to template
===============

此工程用于将psd导出为图片(png24)，某种html(html/jade/svg)，以及css。

### install
 
1. ```git clone``` 到本地，然后```npm install```。

### usage

1. 打开需要导出的psd，进行一些调整(注意事项见下)，然后选择 ``` 文件 -> 脚本 -> 浏览 ``` 选择此项目中的 
    ```./jsx/exports_layer_info.jsx ```

1. 脚本执行完成后，会在 ```d:/temp``` (默认，可以更改)下输出图片资源和一个图层信息文件```layer_name_map.json```。

1. 进入本项目根目录，执行 ```node bin/www```, 然后访问 ```http://localhost:3005``` 。

1. 在打开的页面上你可以对各个节点进行一些基本的设置，使得导出的 html/jade/svg/css 等，更符合你的需求。

### 注意事项

1. photoshop并没有为每个图层设计一个可以公开获取的uuid，因此导出时使用图层路径作为每个图层的标识符，并且使用图层名称生成了css的classname。

1. psd的文档模型与jsx的交互相当的缓慢，因此在使用此导出脚本前你需要将不必要的图层都合并起来以提升使用体验。

1. 导出图层时，大多数图层样式都无法转换成css，因此都会作为图片的一部分导出。

1. 图层的混合模式，都无法转换成css，因此导出前你需要保证混合模式已经应用，并且转换成normal。

1. photoshop处理文字的方式与 html/svg 不同，因此最后你需要微调文字样式。

1. only test on photoshop cs6。

1. 自动合并只是脑残的把所有图层组都合并掉，仅导出一级图层而已，具体效果依赖于图层的组织形式，因此使用前需要进行一些调整。

### TODOS

1. [ ] 更方便使用的模板组织。

1. [ ] 支持一点基本的图层名称规则。

1. [ ] 为处理服务增加更多人性化选项。

1. [ ] 布局自动探测。

1. [x] 给导出脚本增加一个选项，自动合并碎片图层。

1. [x] 导出脚本中提供一个选项，让你可以选择导出存储的位置。

1. [x] 在启动处理服务时增加一个选项，让你可以选择资源的位置。

1. [x] 导出脚本中提供一个ui，显示导出的进度，以及中途取消的功能。
