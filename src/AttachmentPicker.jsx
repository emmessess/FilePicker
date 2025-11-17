import React, { createElement, useCallback, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, Image, useColorScheme } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import RNFS from "react-native-fs";
import { mergeNativeStyles } from "@mendix/pluggable-widgets-tools";
import Icon from "react-native-vector-icons/MaterialIcons";
import Pdf from "react-native-pdf";

const defaultStyle = {
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#393636ff",
        borderRadius: 8,
        overflow: "hidden",
    },
    textContainer: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    fileName: {
        color: "#333",
        fontSize: 16,
    },
    placeholder: {
        color: "#aaa",
        fontSize: 16,
    },
    iconContainer: {
        backgroundColor: "#ff8800ff",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        justifyContent: "center",
        alignItems: "",
        alignSelf: "stretch"
    },
    icon: {
        color: "#fff",
        fontSize: 22,
    },
    eyeiconContainer: {
        backgroundColor: "#ff8800ff",
        paddingHorizontal: 14,
        paddingVertical: 10,
        justifyContent: "center",
        alignItems: "",
        alignSelf: "stretch"
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center"
    },
    fullImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain"
    }

};


export function AttachmentPicker(props) {
    const { label, buttonBackground, style } = props
    const styles = mergeNativeStyles(defaultStyle, style);
    const [selectedFile, setSelectedFile] = useState(null);
    const [pendingFileName, setPendingFileName] = useState(null);
    const [pendingFileContent, setPendingFileContent] = useState(null);
    const [pendingFileType, setPendingFileType] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewType, setPreviewType] = useState(null); // "image" or "pdf"
    const [previewUri, setPreviewUri] = useState(null);

    const resolvedBg =
        buttonBackground?.value || buttonBackground || "#FF7AFF";

    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const theme = {
        light: {
            labelText: "#000",
        },
        dark: {
            labelText: "#fff",
        }
    };
    const currentTheme = isDark ? theme.dark : theme.light;
    const labelStyle = {
        color: currentTheme.labelText,
        fontSize: 18,
        marginBottom: 4
    };
    useEffect(() => {
        const fileName = props.fileName?.value;
        const mimeType = props.mimeType?.value;
        const content = props.content?.value;

        if (fileName) {
            setSelectedFile(fileName);
            setPendingFileName(fileName);
            setPendingFileType(mimeType || "application/octet-stream");

            // If Mendix has content (Base64), prepare for preview
            if (content) {
                setPendingFileContent(content);

                // Build preview directly from Base64
                if (mimeType?.startsWith("image")) {
                    setPreviewUri(`data:${mimeType};base64,${content}`);
                    setPreviewType("image");
                } else if (mimeType?.includes("pdf")) {
                    setPreviewUri(`data:application/pdf;base64,${content}`);
                    setPreviewType("pdf");
                }
            }
        }
    }, [
        props.fileName?.value,
        props.mimeType?.value,
        props.content?.value
    ]);

    useEffect(() => {
        if (
            pendingFileName &&
            props.fileName &&
            props.fileName.status === "available" &&
            !props.fileName.readOnly
        ) {
            props.fileName.setValue?.(pendingFileName);

            setPendingFileName(null);
        }

        if (
            pendingFileType &&
            props.mimeType &&
            props.mimeType.status === "available" &&
            !props.mimeType.readOnly
        ) {
            props.mimeType.setValue?.(pendingFileType);
            setPendingFileType(null);
        }


        if (
            pendingFileContent &&
            props.content &&
            props.content.status === "available" &&
            !props.content.readOnly
        ) {
            props.content.setValue?.(pendingFileContent);
            setPendingFileContent(null);
        }


    }, [pendingFileName, props.fileName, pendingFileContent, props.FileContent, pendingFileType, props.setPendingFileType, props.onFileSelected]);

    const handlePick = useCallback(() => {
        Alert.alert("Select Source", "", [
            { text: "Camera", onPress: handleCamera },
            { text: "Gallery", onPress: handleGallery },
            { text: "File", onPress: handlePickFile },
            { text: "Cancel", style: "cancel" }
        ]);
    }, []);

    const handlePickFile = useCallback(async () => {
        try {
            const result = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf]
            });

            // UI update
            setSelectedFile(result.name);

            const uri = decodeURI(result.uri).replace('file://', '');
            const base64 = await RNFS.readFile(uri, 'base64');
            setPreviewUri(uri)
            setPreviewType("pdf");

            setPendingFileName(result.name);
            setPendingFileType(result.type || "application/octet-stream");
            setPendingFileContent(base64);

        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                console.error("File picker error:", err);
            }
        }
    }, []);

    const handleCamera = async () => {
        const result = await launchCamera({
            mediaType: "photo",
            includeBase64: true,
            quality: 0.6

        });

        if (!result.assets || !result.assets[0]) return;

        const asset = result.assets[0];
        setSelectedFile(asset.fileName);
        setPreviewType("image");
        setPreviewUri(asset.uri);
        setPendingFileName(asset.fileName);
        setPendingFileType(asset.type || "image/jpeg");
        setPendingFileContent(asset.base64 || "");
    };

    const handleGallery = async () => {
        const result = await launchImageLibrary({
            mediaType: "photo",
            includeBase64: true,
            quality: 0.6
        });

        if (!result.assets || !result.assets[0]) return;

        const asset = result.assets[0];
        setSelectedFile(asset.fileName);
        setPreviewType("image");
        setPreviewUri(asset.uri);
        setPendingFileName(asset.fileName);
        setPendingFileType(asset.type || "image/jpeg");
        setPendingFileContent(asset.base64 || "");
    };

    const openPreview = () => {
        if (!previewUri) return;
        setModalVisible(true);
    };

    return (
        <View>
            <Text style={labelStyle}>
                {label.value}
            </Text>
            <View style={styles.container}>
                <View style={styles.textContainer}>
                    <Text style={selectedFile ? styles.fileName : styles.placeholder}>
                        {selectedFile}
                    </Text>
                </View>
                {selectedFile && (
                    <TouchableOpacity onPress={openPreview} style={[
                        styles.eyeiconContainer,
                        { backgroundColor: resolvedBg }
                    ]}>
                        <Icon name="visibility" style={styles.icon} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handlePick} style={[
                    styles.iconContainer,
                    { backgroundColor: resolvedBg }
                ]}>
                    <Icon name="attach-file" style={styles.icon} />
                </TouchableOpacity>
            </View>
            <Modal visible={modalVisible} transparent={false}>
                <TouchableOpacity
                    style={styles.modalContainer}
                    onPress={() => setModalVisible(false)}
                >
                    {previewType === "image" ? (
                        <Image source={{ uri: previewUri }} style={styles.fullImage} />
                    ) : (
                        <Pdf
                            source={{ uri: previewUri }}
                            style={{ width: "100%", height: "100%" }}
                        />
                    )}
                </TouchableOpacity>
            </Modal>

        </View>
    );
}
