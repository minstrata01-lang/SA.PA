export default function OptimizedImage({
    src,
    alt,
    className,
    loading = "lazy",
    decoding = "async",
    fetchPriority,
    sizes,
    srcSet,
    style,
    width,
    height,
    ...props
}) {
    const resolvedLoading = fetchPriority === "high" ? "eager" : loading;

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading={resolvedLoading}
            decoding={decoding}
            fetchPriority={fetchPriority}
            sizes={sizes}
            srcSet={srcSet}
            style={style}
            width={width}
            height={height}
            {...props}
        />
    );
}