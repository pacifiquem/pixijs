import { DEG_TO_RAD, RAD_TO_DEG, Rectangle, Transform, utils } from '@pixi/core';
import { Bounds } from './Bounds';

import type { Filter, IPointData, MaskData, Matrix, ObservablePoint, Point, Renderer } from '@pixi/core';
import type { Container } from './Container';

export interface IDestroyOptions
{
    children?: boolean;
    texture?: boolean;
    baseTexture?: boolean;
}

export interface DisplayObjectEvents extends GlobalMixins.DisplayObjectEvents
{
    added: [container: Container];
    childAdded: [child: DisplayObject, container: Container, index: number];
    childRemoved: [child: DisplayObject, container: Container, index: number];
    destroyed: [];
    removed: [container: Container];
}

export interface DisplayObject
    extends Omit<GlobalMixins.DisplayObject, keyof utils.EventEmitter<DisplayObjectEvents>>,
    utils.EventEmitter<DisplayObjectEvents> {}

/**
 * The base class for all objects that are rendered on the screen.
 *
 * This is an abstract class and can not be used on its own; rather it should be extended.
 *
 * ## Display objects implemented in PixiJS
 *
 * | Display Object                  | Description                                                           |
 * | ------------------------------- | --------------------------------------------------------------------- |
 * | {@link PIXI.Container}          | Adds support for `children` to DisplayObject                          |
 * | {@link PIXI.Graphics}           | Shape-drawing display object similar to the Canvas API                |
 * | {@link PIXI.Sprite}             | Draws textures (i.e. images)                                          |
 * | {@link PIXI.Text}               | Draws text using the Canvas API internally                            |
 * | {@link PIXI.BitmapText}         | More scaleable solution for text rendering, reusing glyph textures    |
 * | {@link PIXI.TilingSprite}       | Draws textures/images in a tiled fashion                              |
 * | {@link PIXI.AnimatedSprite}     | Draws an animation of multiple images                                 |
 * | {@link PIXI.Mesh}               | Provides a lower-level API for drawing meshes with custom data        |
 * | {@link PIXI.NineSlicePlane}     | Mesh-related                                                          |
 * | {@link PIXI.SimpleMesh}         | v4-compatible mesh                                                    |
 * | {@link PIXI.SimplePlane}        | Mesh-related                                                          |
 * | {@link PIXI.SimpleRope}         | Mesh-related                                                          |
 *
 * ## Transforms
 *
 * The [transform]{@link DisplayObject#transform} of a display object describes the projection from its
 * local coordinate space to its parent's local coordinate space. The following properties are derived
 * from the transform:
 *
 * <table>
 *   <thead>
 *     <tr>
 *       <th>Property</th>
 *       <th>Description</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>[pivot]{@link PIXI.DisplayObject#pivot}</td>
 *       <td>
 *         Invariant under rotation, scaling, and skewing. The projection of into the parent's space of the pivot
 *         is equal to position, regardless of the other three transformations. In other words, It is the center of
 *         rotation, scaling, and skewing.
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>[position]{@link PIXI.DisplayObject#position}</td>
 *       <td>
 *         Translation. This is the position of the [pivot]{@link PIXI.DisplayObject#pivot} in the parent's local
 *         space. The default value of the pivot is the origin (0,0). If the top-left corner of your display object
 *         is (0,0) in its local space, then the position will be its top-left corner in the parent's local space.
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>[scale]{@link PIXI.DisplayObject#scale}</td>
 *       <td>
 *         Scaling. This will stretch (or compress) the display object's projection. The scale factors are along the
 *         local coordinate axes. In other words, the display object is scaled before rotated or skewed. The center
 *         of scaling is the [pivot]{@link PIXI.DisplayObject#pivot}.
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>[rotation]{@link PIXI.DisplayObject#rotation}</td>
 *       <td>
 *          Rotation. This will rotate the display object's projection by this angle (in radians).
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>[skew]{@link PIXI.DisplayObject#skew}</td>
 *       <td>
 *         <p>Skewing. This can be used to deform a rectangular display object into a parallelogram.</p>
 *         <p>
 *         In PixiJS, skew has a slightly different behaviour than the conventional meaning. It can be
 *         thought of the net rotation applied to the coordinate axes (separately). For example, if "skew.x" is
 *         ⍺ and "skew.y" is β, then the line x = 0 will be rotated by ⍺ (y = -x*cot⍺) and the line y = 0 will be
 *         rotated by β (y = x*tanβ). A line y = x*tanϴ (i.e. a line at angle ϴ to the x-axis in local-space) will
 *         be rotated by an angle between ⍺ and β.
 *         </p>
 *         <p>
 *         It can be observed that if skew is applied equally to both axes, then it will be equivalent to applying
 *         a rotation. Indeed, if "skew.x" = -ϴ and "skew.y" = ϴ, it will produce an equivalent of "rotation" = ϴ.
 *         </p>
 *         <p>
 *         Another quite interesting observation is that "skew.x", "skew.y", rotation are communtative operations. Indeed,
 *         because rotation is essentially a careful combination of the two.
 *         </p>
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>angle</td>
 *       <td>Rotation. This is an alias for [rotation]{@link PIXI.DisplayObject#rotation}, but in degrees.</td>
 *     </tr>
 *     <tr>
 *       <td>x</td>
 *       <td>Translation. This is an alias for position.x!</td>
 *     </tr>
 *     <tr>
 *       <td>y</td>
 *       <td>Translation. This is an alias for position.y!</td>
 *     </tr>
 *     <tr>
 *       <td>width</td>
 *       <td>
 *         Implemented in [Container]{@link PIXI.Container}. Scaling. The width property calculates scale.x by dividing
 *         the "requested" width by the local bounding box width. It is indirectly an abstraction over scale.x, and there
 *         is no concept of user-defined width.
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>height</td>
 *       <td>
 *         Implemented in [Container]{@link PIXI.Container}. Scaling. The height property calculates scale.y by dividing
 *         the "requested" height by the local bounding box height. It is indirectly an abstraction over scale.y, and there
 *         is no concept of user-defined height.
 *       </td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * ## Bounds
 *
 * The bounds of a display object is defined by the minimum axis-aligned rectangle in world space that can fit
 * around it. The abstract `calculateBounds` method is responsible for providing it (and it should use the
 * `worldTransform` to calculate in world space).
 *
 * There are a few additional types of bounding boxes:
 *
 * | Bounds                | Description                                                                              |
 * | --------------------- | ---------------------------------------------------------------------------------------- |
 * | World Bounds          | This is synonymous is the regular bounds described above. See `getBounds()`.             |
 * | Local Bounds          | This the axis-aligned bounding box in the parent's local space. See `getLocalBounds()`.  |
 * | Render Bounds         | The bounds, but including extra rendering effects like filter padding.                   |
 * | Projected Bounds      | The bounds of the projected display object onto the screen. Usually equals world bounds. |
 * | Relative Bounds       | The bounds of a display object when projected onto a ancestor's (or parent's) space.     |
 * | Natural Bounds        | The bounds of an object in its own local space (not parent's space, like in local bounds)|
 * | Content Bounds        | The natural bounds when excluding all children of a `Container`.                         |
 *
 * ### calculateBounds
 *
 * [Container]{@link Container} already implements `calculateBounds` in a manner that includes children.
 *
 * But for a non-Container display object, the `calculateBounds` method must be overridden in order for `getBounds` and
 * `getLocalBounds` to work. This method must write the bounds into `this._bounds`.
 *
 * Generally, the following technique works for most simple cases: take the list of points
 * forming the "hull" of the object (i.e. outline of the object's shape), and then add them
 * using {@link PIXI.Bounds#addPointMatrix}.
 *
 * ```js
 * calculateBounds()
 * {
 *     const points = [...];
 *
 *     for (let i = 0, j = points.length; i < j; i++)
 *     {
 *         this._bounds.addPointMatrix(this.worldTransform, points[i]);
 *     }
 * }
 * ```
 *
 * You can optimize this for a large number of points by using {@link PIXI.Bounds#addVerticesMatrix} to pass them
 * in one array together.
 *
 * ## Alpha
 *
 * This alpha sets a display object's **relative opacity** w.r.t its parent. For example, if the alpha of a display
 * object is 0.5 and its parent's alpha is 0.5, then it will be rendered with 25% opacity (assuming alpha is not
 * applied on any ancestor further up the chain).
 *
 * The alpha with which the display object will be rendered is called the [worldAlpha]{@link PIXI.DisplayObject#worldAlpha}.
 *
 * ## Renderable vs Visible
 *
 * The `renderable` and `visible` properties can be used to prevent a display object from being rendered to the
 * screen. However, there is a subtle difference between the two. When using `renderable`, the transforms  of the display
 * object (and its children subtree) will continue to be calculated. When using `visible`, the transforms will not
 * be calculated.
 *
 * It is recommended that applications use the `renderable` property for culling. See
 * [@pixi-essentials/cull]{@link https://www.npmjs.com/package/@pixi-essentials/cull} or
 * [pixi-cull]{@link https://www.npmjs.com/package/pixi-cull} for more details.
 *
 * Otherwise, to prevent an object from rendering in the general-purpose sense - `visible` is the property to use. This
 * one is also better in terms of performance.
 * @memberof PIXI
 */
export abstract class DisplayObject extends utils.EventEmitter<DisplayObjectEvents>
{
    abstract sortDirty: boolean;

    /** The display object container that contains this display object. */
    public parent: Container;

    /**
     * The multiplied alpha of the displayObject.
     * @readonly
     */
    public worldAlpha: number;

    /**
     * World transform and local transform of this object.
     * This will become read-only later, please do not assign anything there unless you know what are you doing.
     */
    public transform: Transform;

    /** The opacity of the object. */
    public alpha: number;

    /**
     * The visibility of the object. If false the object will not be drawn, and
     * the updateTransform function will not be called.
     *
     * Only affects recursive calls from parent. You can ask for bounds or call updateTransform manually.
     */
    public visible: boolean;

    /**
     * Can this object be rendered, if false the object will not be drawn but the updateTransform
     * methods will still be called.
     *
     * Only affects recursive calls from parent. You can ask for bounds manually.
     */
    public renderable: boolean;

    /**
     * Should this object be rendered if the bounds of this object are out of frame?
     *
     * Culling has no effect on whether updateTransform is called.
     */
    public cullable: boolean;

    /**
     * If set, this shape is used for culling instead of the bounds of this object.
     * It can improve the culling performance of objects with many children.
     * The culling area is defined in local space.
     */
    public cullArea: Rectangle;

    /**
     * The area the filter is applied to. This is used as more of an optimization
     * rather than figuring out the dimensions of the displayObject each frame you can set this rectangle.
     *
     * Also works as an interaction mask.
     */
    public filterArea: Rectangle;

    /**
     * Sets the filters for the displayObject.
     * IMPORTANT: This is a WebGL only feature and will be ignored by the canvas renderer.
     * To remove filters simply set this property to `'null'`.
     */
    public filters: Filter[] | null;

    /** Used to fast check if a sprite is.. a sprite! */
    public isSprite: boolean;

    /** Does any other displayObject use this object as a mask? */
    public isMask: boolean;

    /**
     * Which index in the children array the display component was before the previous zIndex sort.
     * Used by containers to help sort objects with the same zIndex, by using previous array index as the decider.
     * @protected
     */
    public _lastSortedIndex: number;

    /**
     * The original, cached mask of the object.
     * @protected
     */
    public _mask: Container | MaskData;

    /** The bounds object, this is used to calculate and store the bounds of the displayObject. */
    public _bounds: Bounds;

    /** Local bounds object, swapped with `_bounds` when using `getLocalBounds()`. */
    public _localBounds: Bounds;

    /**
     * The zIndex of the displayObject.
     * A higher value will mean it will be rendered on top of other displayObjects within the same container.
     * @protected
     */
    protected _zIndex: number;

    /**
     * Currently enabled filters.
     * @protected
     */
    protected _enabledFilters: Filter[];

    /** Flags the cached bounds as dirty. */
    protected _boundsID: number;

    /** Cache of this display-object's bounds-rectangle. */
    protected _boundsRect: Rectangle;

    /** Cache of this display-object's local-bounds rectangle. */
    protected _localBoundsRect: Rectangle;

    /** If the object has been destroyed via destroy(). If true, it should not be used. */
    protected _destroyed: boolean;

    /** The number of times this object is used as a mask by another object. */
    private _maskRefCount: number;
    private tempDisplayObjectParent: TemporaryDisplayObject;
    public displayObjectUpdateTransform: () => void;

    /**
     * Mixes all enumerable properties and methods from a source object to DisplayObject.
     * @param source - The source of properties and methods to mix in.
     */
    static mixin(source: utils.Dict<any>): void
    {
        // in ES8/ES2017, this would be really easy:
        // Object.defineProperties(DisplayObject.prototype, Object.getOwnPropertyDescriptors(source));

        // get all the enumerable property keys
        const keys = Object.keys(source);

        // loop through properties
        for (let i = 0; i < keys.length; ++i)
        {
            const propertyName = keys[i];

            // Set the property using the property descriptor - this works for accessors and normal value properties
            Object.defineProperty(
                DisplayObject.prototype,
                propertyName,
                Object.getOwnPropertyDescriptor(source, propertyName)
            );
        }
    }

    constructor()
    {
        super();

        this.tempDisplayObjectParent = null;

        // TODO: need to create Transform from factory
        this.transform = new Transform();
        this.alpha = 1;
        this.visible = true;
        this.renderable = true;
        this.cullable = false;
        this.cullArea = null;

        this.parent = null;
        this.worldAlpha = 1;

        this._lastSortedIndex = 0;
        this._zIndex = 0;

        this.filterArea = null;
        this.filters = null;
        this._enabledFilters = null;

        this._bounds = new Bounds();
        this._localBounds = null;
        this._boundsID = 0;
        this._boundsRect = null;
        this._localBoundsRect = null;
        this._mask = null;
        this._maskRefCount = 0;
        this._destroyed = false;

        this.isSprite = false;
        this.isMask = false;
    }

    /**
     * Fired when this DisplayObject is added to a Container.
     * @instance
     * @event added
     * @param {PIXI.Container} container - The container added to.
     */

    /**
     * Fired when this DisplayObject is removed from a Container.
     * @instance
     * @event removed
     * @param {PIXI.Container} container - The container removed from.
     */

    /**
     * Fired when this DisplayObject is destroyed. This event is emitted once
     * destroy is finished.
     * @instance
     * @event destroyed
     */

    /** Readonly flag for destroyed display objects. */
    get destroyed(): boolean
    {
        return this._destroyed;
    }

    /** Recalculates the bounds of the display object. */
    abstract calculateBounds(): void;

    abstract removeChild(child: DisplayObject): void;

    /**
     * Renders the object using the WebGL renderer.
     * @param renderer - The renderer.
     */
    abstract render(renderer: Renderer): void;

    /** Recursively updates transform of all objects from the root to this one internal function for toLocal() */
    protected _recursivePostUpdateTransform(): void
    {
        if (this.parent)
        {
            this.parent._recursivePostUpdateTransform();
            this.transform.updateTransform(this.parent.transform);
        }
        else
        {
            this.transform.updateTransform(this._tempDisplayObjectParent.transform);
        }
    }

    /** Updates the object transform for rendering. TODO - Optimization pass! */
    updateTransform(): void
    {
        this._boundsID++;

        this.transform.updateTransform(this.parent.transform);
        // multiply the alphas..
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
    }

    /**
     * Calculates and returns the (world) bounds of the display object as a [Rectangle]{@link PIXI.Rectangle}.
     *
     * This method is expensive on containers with a large subtree (like the stage). This is because the bounds
     * of a container depend on its children's bounds, which recursively causes all bounds in the subtree to
     * be recalculated. The upside, however, is that calling `getBounds` once on a container will indeed update
     * the bounds of all children (the whole subtree, in fact). This side effect should be exploited by using
     * `displayObject._bounds.getRectangle()` when traversing through all the bounds in a scene graph. Otherwise,
     * calling `getBounds` on each object in a subtree will cause the total cost to increase quadratically as
     * its height increases.
     *
     * The transforms of all objects in a container's **subtree** and of all **ancestors** are updated.
     * The world bounds of all display objects in a container's **subtree** will also be recalculated.
     *
     * The `_bounds` object stores the last calculation of the bounds. You can use to entirely skip bounds
     * calculation if needed.
     *
     * ```js
     * const lastCalculatedBounds = displayObject._bounds.getRectangle(optionalRect);
     * ```
     *
     * Do know that usage of `getLocalBounds` can corrupt the `_bounds` of children (the whole subtree, actually). This
     * is a known issue that has not been solved. See [getLocalBounds]{@link PIXI.DisplayObject#getLocalBounds} for more
     * details.
     *
     * `getBounds` should be called with `skipUpdate` equal to `true` in a render() call. This is because the transforms
     * are guaranteed to be update-to-date. In fact, recalculating inside a render() call may cause corruption in certain
     * cases.
     * @param skipUpdate - Setting to `true` will stop the transforms of the scene graph from
     *  being updated. This means the calculation returned MAY be out of date BUT will give you a
     *  nice performance boost.
     * @param rect - Optional rectangle to store the result of the bounds calculation.
     * @returns - The minimum axis-aligned rectangle in world space that fits around this object.
     */
    getBounds(skipUpdate?: boolean, rect?: Rectangle): Rectangle
    {
        if (!skipUpdate)
        {
            if (!this.parent)
            {
                this.parent = this._tempDisplayObjectParent as Container;
                this.updateTransform();
                this.parent = null;
            }
            else
            {
                this._recursivePostUpdateTransform();
                this.updateTransform();
            }
        }

        if (this._bounds.updateID !== this._boundsID)
        {
            this.calculateBounds();
            this._bounds.updateID = this._boundsID;
        }

        if (!rect)
        {
            if (!this._boundsRect)
            {
                this._boundsRect = new Rectangle();
            }

            rect = this._boundsRect;
        }

        return this._bounds.getRectangle(rect);
    }

    /**
     * Retrieves the local bounds of the displayObject as a rectangle object.
     * @param rect - Optional rectangle to store the result of the bounds calculation.
     * @returns - The rectangular bounding area.
     */
    getLocalBounds(rect?: Rectangle): Rectangle
    {
        if (!rect)
        {
            if (!this._localBoundsRect)
            {
                this._localBoundsRect = new Rectangle();
            }

            rect = this._localBoundsRect;
        }

        if (!this._localBounds)
        {
            this._localBounds = new Bounds();
        }

        const transformRef = this.transform;
        const parentRef = this.parent;

        this.parent = null;
        this.transform = this._tempDisplayObjectParent.transform;

        const worldBounds = this._bounds;
        const worldBoundsID = this._boundsID;

        this._bounds = this._localBounds;

        const bounds = this.getBounds(false, rect);

        this.parent = parentRef;
        this.transform = transformRef;

        this._bounds = worldBounds;
        this._bounds.updateID += this._boundsID - worldBoundsID;// reflect side-effects

        return bounds;
    }

    /**
     * Calculates the global position of the display object.
     * @param position - The world origin to calculate from.
     * @param point - A Point object in which to store the value, optional
     *  (otherwise will create a new Point).
     * @param skipUpdate - Should we skip the update transform.
     * @returns - A point object representing the position of this object.
     */
    toGlobal<P extends IPointData = Point>(position: IPointData, point?: P, skipUpdate = false): P
    {
        if (!skipUpdate)
        {
            this._recursivePostUpdateTransform();

            // this parent check is for just in case the item is a root object.
            // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
            // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
            if (!this.parent)
            {
                this.parent = this._tempDisplayObjectParent as Container;
                this.displayObjectUpdateTransform();
                this.parent = null;
            }
            else
            {
                this.displayObjectUpdateTransform();
            }
        }

        // don't need to update the lot
        return this.worldTransform.apply<P>(position, point);
    }

    /**
     * Calculates the local position of the display object relative to another point.
     * @param position - The world origin to calculate from.
     * @param from - The DisplayObject to calculate the global position from.
     * @param point - A Point object in which to store the value, optional
     *  (otherwise will create a new Point).
     * @param skipUpdate - Should we skip the update transform
     * @returns - A point object representing the position of this object
     */
    toLocal<P extends IPointData = Point>(position: IPointData, from?: DisplayObject, point?: P, skipUpdate?: boolean): P
    {
        if (from)
        {
            position = from.toGlobal(position, point, skipUpdate);
        }

        if (!skipUpdate)
        {
            this._recursivePostUpdateTransform();

            // this parent check is for just in case the item is a root object.
            // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
            // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
            if (!this.parent)
            {
                this.parent = this._tempDisplayObjectParent as Container;
                this.displayObjectUpdateTransform();
                this.parent = null;
            }
            else
            {
                this.displayObjectUpdateTransform();
            }
        }

        // simply apply the matrix..
        return this.worldTransform.applyInverse<P>(position, point);
    }

    /**
     * Set the parent Container of this DisplayObject.
     * @param container - The Container to add this DisplayObject to.
     * @returns - The Container that this DisplayObject was added to.
     */
    setParent(container: Container): Container
    {
        if (!container || !container.addChild)
        {
            throw new Error('setParent: Argument must be a Container');
        }

        container.addChild(this);

        return container;
    }

    /** Remove the DisplayObject from its parent Container. If the DisplayObject has no parent, do nothing. */
    removeFromParent()
    {
        this.parent?.removeChild(this);
    }

    /**
     * Convenience function to set the position, scale, skew and pivot at once.
     * @param x - The X position
     * @param y - The Y position
     * @param scaleX - The X scale value
     * @param scaleY - The Y scale value
     * @param rotation - The rotation
     * @param skewX - The X skew value
     * @param skewY - The Y skew value
     * @param pivotX - The X pivot value
     * @param pivotY - The Y pivot value
     * @returns - The DisplayObject instance
     */
    setTransform(x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, skewX = 0, skewY = 0, pivotX = 0, pivotY = 0): this
    {
        this.position.x = x;
        this.position.y = y;
        this.scale.x = !scaleX ? 1 : scaleX;
        this.scale.y = !scaleY ? 1 : scaleY;
        this.rotation = rotation;
        this.skew.x = skewX;
        this.skew.y = skewY;
        this.pivot.x = pivotX;
        this.pivot.y = pivotY;

        return this;
    }

    /**
     * Base destroy method for generic display objects. This will automatically
     * remove the display object from its parent Container as well as remove
     * all current event listeners and internal references. Do not use a DisplayObject
     * after calling `destroy()`.
     * @param _options
     */
    destroy(_options?: IDestroyOptions | boolean): void
    {
        this.removeFromParent();

        this._destroyed = true;
        this.transform = null;

        this.parent = null;
        this._bounds = null;
        this.mask = null;

        this.cullArea = null;
        this.filters = null;
        this.filterArea = null;
        this.hitArea = null;

        this.interactive = false;
        this.interactiveChildren = false;

        this.emit('destroyed');
        this.removeAllListeners();
    }

    /**
     * @protected
     * @member {PIXI.Container}
     */
    get _tempDisplayObjectParent(): TemporaryDisplayObject
    {
        if (this.tempDisplayObjectParent === null)
        {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            this.tempDisplayObjectParent = new TemporaryDisplayObject();
        }

        return this.tempDisplayObjectParent;
    }

    /**
     * Used in Renderer, cacheAsBitmap and other places where you call an `updateTransform` on root.
     *
     * ```js
     * const cacheParent = elem.enableTempParent();
     * elem.updateTransform();
     * elem.disableTempParent(cacheParent);
     * ```
     * @returns - Current parent
     */
    enableTempParent(): Container
    {
        const myParent = this.parent;

        this.parent = this._tempDisplayObjectParent as Container;

        return myParent;
    }

    /**
     * Pair method for `enableTempParent`
     * @param cacheParent - Actual parent of element
     */
    disableTempParent(cacheParent: Container): void
    {
        this.parent = cacheParent;
    }

    /**
     * The position of the displayObject on the x axis relative to the local coordinates of the parent.
     * An alias to position.x
     */
    get x(): number
    {
        return this.position.x;
    }

    set x(value: number)
    {
        this.transform.position.x = value;
    }

    /**
     * The position of the displayObject on the y axis relative to the local coordinates of the parent.
     * An alias to position.y
     */
    get y(): number
    {
        return this.position.y;
    }

    set y(value: number)
    {
        this.transform.position.y = value;
    }

    /**
     * Current transform of the object based on world (parent) factors.
     * @readonly
     */
    get worldTransform(): Matrix
    {
        return this.transform.worldTransform;
    }

    /**
     * Current transform of the object based on local factors: position, scale, other stuff.
     * @readonly
     */
    get localTransform(): Matrix
    {
        return this.transform.localTransform;
    }

    /**
     * The coordinate of the object relative to the local coordinates of the parent.
     * @since 4.0.0
     */
    get position(): ObservablePoint
    {
        return this.transform.position;
    }

    set position(value: IPointData)
    {
        this.transform.position.copyFrom(value);
    }

    /**
     * The scale factors of this object along the local coordinate axes.
     *
     * The default scale is (1, 1).
     * @since 4.0.0
     */
    get scale(): ObservablePoint
    {
        return this.transform.scale;
    }

    set scale(value: IPointData)
    {
        this.transform.scale.copyFrom(value);
    }

    /**
     * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
     * is the projection of `pivot` in the parent's local space.
     *
     * By default, the pivot is the origin (0, 0).
     * @since 4.0.0
     */
    get pivot(): ObservablePoint
    {
        return this.transform.pivot;
    }

    set pivot(value: IPointData)
    {
        this.transform.pivot.copyFrom(value);
    }

    /**
     * The skew factor for the object in radians.
     * @since 4.0.0
     */
    get skew(): ObservablePoint
    {
        return this.transform.skew;
    }

    set skew(value: IPointData)
    {
        this.transform.skew.copyFrom(value);
    }

    /**
     * The rotation of the object in radians.
     * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
     */
    get rotation(): number
    {
        return this.transform.rotation;
    }

    set rotation(value: number)
    {
        this.transform.rotation = value;
    }

    /**
     * The angle of the object in degrees.
     * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
     */
    get angle(): number
    {
        return this.transform.rotation * RAD_TO_DEG;
    }

    set angle(value: number)
    {
        this.transform.rotation = value * DEG_TO_RAD;
    }

    /**
     * The zIndex of the displayObject.
     *
     * If a container has the sortableChildren property set to true, children will be automatically
     * sorted by zIndex value; a higher value will mean it will be moved towards the end of the array,
     * and thus rendered on top of other display objects within the same container.
     * @see PIXI.Container#sortableChildren
     */
    get zIndex(): number
    {
        return this._zIndex;
    }

    set zIndex(value: number)
    {
        this._zIndex = value;
        if (this.parent)
        {
            this.parent.sortDirty = true;
        }
    }

    /**
     * Indicates if the object is globally visible.
     * @readonly
     */
    get worldVisible(): boolean
    {
        let item = this as DisplayObject;

        do
        {
            if (!item.visible)
            {
                return false;
            }

            item = item.parent;
        } while (item);

        return true;
    }

    /**
     * Sets a mask for the displayObject. A mask is an object that limits the visibility of an
     * object to the shape of the mask applied to it. In PixiJS a regular mask must be a
     * {@link PIXI.Graphics} or a {@link PIXI.Sprite} object. This allows for much faster masking in canvas as it
     * utilities shape clipping. Furthermore, a mask of an object must be in the subtree of its parent.
     * Otherwise, `getLocalBounds` may calculate incorrect bounds, which makes the container's width and height wrong.
     * To remove a mask, set this property to `null`.
     *
     * For sprite mask both alpha and red channel are used. Black mask is the same as transparent mask.
     * @example
     * import { Graphics, Sprite } from 'pixi.js';
     *
     * const graphics = new Graphics();
     * graphics.beginFill(0xFF3300);
     * graphics.drawRect(50, 250, 100, 100);
     * graphics.endFill();
     *
     * const sprite = new Sprite(texture);
     * sprite.mask = graphics;
     * @todo At the moment, CanvasRenderer doesn't support Sprite as mask.
     */
    get mask(): Container | MaskData | null
    {
        return this._mask;
    }

    set mask(value: Container | MaskData | null)
    {
        if (this._mask === value)
        {
            return;
        }

        if (this._mask)
        {
            const maskObject = ((this._mask as MaskData).isMaskData
                ? (this._mask as MaskData).maskObject : this._mask) as Container;

            if (maskObject)
            {
                maskObject._maskRefCount--;

                if (maskObject._maskRefCount === 0)
                {
                    maskObject.renderable = true;
                    maskObject.isMask = false;
                }
            }
        }

        this._mask = value;

        if (this._mask)
        {
            const maskObject = ((this._mask as MaskData).isMaskData
                ? (this._mask as MaskData).maskObject : this._mask) as Container;

            if (maskObject)
            {
                if (maskObject._maskRefCount === 0)
                {
                    maskObject.renderable = false;
                    maskObject.isMask = true;
                }

                maskObject._maskRefCount++;
            }
        }
    }
}

/**
 * @private
 */
export class TemporaryDisplayObject extends DisplayObject
{
    calculateBounds: () => null;
    removeChild: (child: DisplayObject) => null;
    render: (renderer: Renderer) => null;
    sortDirty: boolean = null;
}

/**
 * DisplayObject default updateTransform, does not update children of container.
 * Will crash if there's no parent element.
 * @memberof PIXI.DisplayObject#
 * @method displayObjectUpdateTransform
 */
DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;
